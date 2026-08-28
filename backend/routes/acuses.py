from io import BytesIO
import json
from PIL import Image
from flask import Blueprint, jsonify, request
from sqlalchemy import text
from db.masterRepo import DatabaseSession
from models.emision.ItemEmision import ItemEmision
import re
import base64
import requests
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask_jwt_extended import jwt_required
from utils.auth_helpers import get_current_grupo_cliente

acuses = Blueprint('acuses', __name__)

@acuses.route('/api/acuses/loteDropDwn', methods=['GET'])
@jwt_required()
def getLoteDropDwn():
    try: 
        with DatabaseSession().get_session() as session:
            query = text('SELECT DISTINCT(lote) FROM "itemEmision" where "idGrupoCliente" = 2 and "estadoMetro" is null')
            data_query = session.execute(query)

            loteDropDown = [row.lote for row in data_query]

            if not loteDropDown:
                return jsonify([]), 204

        return jsonify(loteDropDown), 200

    except Exception as e:
        print(e)
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
    
def encode_image_to_base64(url, quality=40, resize_factor=0.5): 
    if not url:
        return None
        
    try:
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return None

        # Devolver directamente el contenido binario en base64
        # SIN USAR PIL EN ABSOLUTO
        return base64.b64encode(response.content).decode("utf-8")

    except Exception as e:
        print(f"Error al procesar imagen: {e}")
        return None

# ─── fetch_data async (reemplaza la versión sync) ────────────────────────────

def _normalizar_fecha_api(fechaEmision: str) -> str | None:
    """Convierte fecha a DDMMYYYY para la URL de la API externa."""
    if not fechaEmision:
        return None
    if '-' in fechaEmision:
        partes = fechaEmision.split('-')
        if len(partes) == 3:
            return f"{partes[2]}{partes[1]}{partes[0]}"
    elif '/' in fechaEmision:
        partes = fechaEmision.split('/')
        if len(partes) == 3:
            return f"{partes[0]}{partes[1]}{partes[2]}"
    return fechaEmision


def fetch_data_bulk(items_grupo4: list[tuple]) -> dict:
    """
    Hace todas las llamadas a la API externa en paralelo con ThreadPoolExecutor.
    
    items_grupo4: lista de (nroCliente, fechaEmision_raw)
    Retorna: dict { (nroCliente, fechaEmision_raw): api_data_or_None }
    """
    def _fetch_one(nroCliente, fecha_raw):
        fecha_fmt = _normalizar_fecha_api(fecha_raw)
        if not fecha_fmt:
            return (nroCliente, fecha_raw), None
        url = f"https://metrogasdocs2.docuprint.com/Api/Form/{nroCliente}/{fecha_fmt}"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200 or not response.text.strip():
                return (nroCliente, fecha_raw), None
            data = response.json()
            return (nroCliente, fecha_raw), (data if data else None)
        except (ValueError, requests.exceptions.RequestException):
            return (nroCliente, fecha_raw), None

    results = {}
    # Limitar concurrencia a 20 workers para no saturar el servidor externo
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {
            executor.submit(_fetch_one, nc, fe): (nc, fe)
            for nc, fe in items_grupo4
        }
        for future in as_completed(futures):
            key, data = future.result()
            results[key] = data
    return results


# ─── Helpers de formato (sin cambios de lógica) ──────────────────────────────

def _formatear_fecha_db(fecha_str):
    if not fecha_str:
        return None
    if isinstance(fecha_str, str) and ' ' in fecha_str:
        return fecha_str.split(' ')[0]
    return fecha_str

def _formatear_hora_db(hora_str):
    if not hora_str:
        return None
    if isinstance(hora_str, str) and '.' in hora_str:
        return hora_str.split('.')[0]
    return hora_str

def _formatear_fecha_salida(fecha_str):
    if not fecha_str:
        return None
    if isinstance(fecha_str, str) and '-' in fecha_str:
        partes = fecha_str.split('-')
        if len(partes) == 3:
            return f"{partes[2]}/{partes[1]}/{partes[0]}"
    return fecha_str

def _formatear_fecha_api(fecha_str):
    if not fecha_str:
        return None
    if isinstance(fecha_str, str) and '/' in fecha_str:
        partes = fecha_str.split('/')
        if len(partes) == 3:
            return f"{partes[2]}-{partes[1]}-{partes[0]}"
    return fecha_str

def _parse_obs_visita(obs, estado_pieza=None):
    datos = {
        "dni": None, "aclaracion": None, "vinculo": None,
        "referencia1": None, "referencia2": None, "referencia3": None,
    }
    if not obs:
        return datos

    # Extraer RECIBIÓ para casos de 1°VBPCR
    recibio_match = re.search(r"\(RECIBIÓ\):\s*([^,]+)", obs)
    
    # Extraer VINCULO normal para otros casos
    vinculo_match = re.search(r"VINCULO:\s*([^,]+)", obs)
    dni_match    = re.search(r"DNI:\s*([\d\s]+)", obs)
    nombre_match = re.search(r"NOMBRE Y APELLIDO:\s*([^,]+)", obs)

    def ref_con_color(n):
        ref   = re.search(rf"{n}° REFERENCIA:\s*([^,]+)", obs)
        color = re.search(rf"{n}° COLOR:\s*([^,]+)", obs)
        if ref:
            ref_text   = ref.group(1).strip()
            color_text = color.group(1).strip() if color else ""
            return f"{ref_text} {color_text}" if color_text else ref_text
        return None

    if dni_match:
        datos["dni"] = re.sub(r"\D", "", dni_match.group(1))
    if nombre_match:
        datos["aclaracion"] = nombre_match.group(1).strip()
    
    # Lógica para vinculo según estado
    if estado_pieza == '1°VBPCR' and recibio_match:
        datos["vinculo"] = recibio_match.group(1).strip()
    elif vinculo_match:
        datos["vinculo"] = vinculo_match.group(1).strip()

    datos["referencia1"] = ref_con_color(1)
    datos["referencia2"] = ref_con_color(2)
    datos["referencia3"] = ref_con_color(3)
    return datos


# ─── Constantes de negocio ───────────────────────────────────────────────────

ESTADOS_VALIDOS = {'DV', 'DR', 'DM', 'F AD', 'F ZP AD', '1° ZP', 'BP CR', 'ZPBP', 'UZP', '1°VBPCR'}
ESTADOS_BAJO_PUERTA = {'1° ZP', 'BP CR', 'ZPBP', 'UZP'}
ESTADOS_FIRMADA = {'F AD', 'F ZP AD', '1°VBPCR'}

TIPO_ENTREGA_MAP = {
    **{e: "Bajo Puerta" for e in ESTADOS_BAJO_PUERTA},
    **{e: "Firmada"     for e in ESTADOS_FIRMADA},
    "DV": "Otros",
    "DR": "Rehusado",
    "DM": "Se mudó",
    "1°VBPCR": "1° Visita Bajo Puerta",
}
DESCRIPCION_MAP = {
    "DV": "Otros",
    "DR": "Rehusado",
    "DM": "Se mudó",
}

@acuses.route('/api/acuses/getAcuses', methods=['GET'])
@jwt_required()
def getAcuses():
    try:
        nroCliente    = request.args.get('nroCliente')
        idGrupoCliente = get_current_grupo_cliente()

        if not nroCliente:
            return jsonify({"message": "Debe proporcionar 'nroCliente'."}), 400
        if not idGrupoCliente:
            return jsonify({"message": "Debe proporcionar 'idGrupoCliente'."}), 400

        idGrupoCliente = int(idGrupoCliente)
        es_grupo4 = (idGrupoCliente == 4)

        with DatabaseSession().get_session() as session:

            # ── 1. Un solo query para todos los lotes del cliente ────────────
            resultados = (
                session.query(ItemEmision)
                .filter(
                    ItemEmision.nroCliente == nroCliente,
                    ItemEmision.idGrupoCliente == idGrupoCliente,
                    ItemEmision.estadoPieza.in_(ESTADOS_VALIDOS),
                    ItemEmision.estadoMetro.is_(None),
                )
                .order_by(ItemEmision.nroCliente)
                .all()
            )

            if not resultados:
                return jsonify({"acusesData": []}), 200

            # ── 2. Query de NR: un solo IN con todos los lotes relevantes ────
            lotes = list({item.lote for item in resultados})
            registros_nr = (
                session.query(ItemEmision)
                .filter(
                    ItemEmision.lote.in_(lotes),
                    ItemEmision.estadoPieza == 'NR',
                    ItemEmision.nroCliente == nroCliente,
                    ItemEmision.idGrupoCliente == idGrupoCliente,
                )
                .all()
            )
            # Clave: (lote, nroCliente) → primer NR encontrado
            nr_por_lote_cliente = {}
            for item in registros_nr:
                k = (item.lote, item.nroCliente)
                if k not in nr_por_lote_cliente:
                    nr_por_lote_cliente[k] = item

            # ── 3. Prefetch API externa en paralelo (solo grupo 4) ───────────
            api_cache = {}
            if es_grupo4:
                items_a_consultar = [
                    (item.nroCliente, item.fechaEmision)
                    for item in resultados
                    if item.fechaEmision
                ]
                # Deduplicar para no llamar dos veces con misma clave
                items_unicos = list({(nc, fe) for nc, fe in items_a_consultar})
                api_cache = fetch_data_bulk(items_unicos)

            # ── 4. Construir respuesta ────────────────────────────────────────
            all_acuses = []

            for item in resultados:
                estado = item.estadoPieza
                obs = _parse_obs_visita(item.obsVisita, item.estadoPieza)

                # Fecha/hora: para bajo puerta usar el registro NR del mismo lote
                fecha = item.fechaDistrib
                hora  = item.horaDistrib
                segunda_visita = {}

                if estado in ESTADOS_BAJO_PUERTA:
                    segunda_visita = {
                        "fecha2": _formatear_fecha_db(item.fechaDistrib) if item.fechaDistrib else None,
                        "hora2":  _formatear_hora_db(item.horaDistrib)  if item.horaDistrib  else None,
                    }
                    nr_item = nr_por_lote_cliente.get((item.lote, item.nroCliente))
                    if nr_item:
                        fecha = nr_item.fechaDistrib
                        hora  = nr_item.horaDistrib

                # Importe / vencimiento
                importe_valor    = item.importe
                vencimiento_valor = item.vencimiento

                if es_grupo4 and item.fechaEmision:
                    api_data = api_cache.get((item.nroCliente, item.fechaEmision))
                    if api_data:
                        importe_valor     = api_data.get('Importe', item.importe)
                        raw_venc          = api_data.get('Vencimiento')
                        vencimiento_valor = _formatear_fecha_api(raw_venc) if raw_venc else item.vencimiento

                foto_base64  = encode_image_to_base64(item.foto)  if item.foto  else None
                firma_base64 = encode_image_to_base64(item.firma) if item.firma else None

                #Para grupo 4 y estado 1°VBPCR, no enviar dni ni aclaracion
                if es_grupo4 and estado == '1°VBPCR':
                    dni_valor = None
                    aclaracion_valor = None
                else:
                    dni_valor = obs.get("dni", "")
                    aclaracion_valor = obs.get("aclaracion", "")

                all_acuses.append({
                    "importe":       importe_valor,
                    "fechaEmision":  _formatear_fecha_salida(item.fechaEmision) if item.fechaEmision else None,
                    "vencimiento":   _formatear_fecha_salida(vencimiento_valor) if vencimiento_valor else None,
                    "nroCliente":    item.nroCliente,
                    "medidor":       item.medidor,
                    "nombreCliente": item.titular,
                    "comprobante":   item.comprobante,
                    "direccion":     f"{item.calle or ''} {item.altura or ''}".strip(),
                    "entreCalle":    item.entreCalles,
                    "codigoPostal":  f"{item.codigoPostal or ''} - {item.localidad or ''}".strip(),
                    "codigoBarras":  item.codigoBarras,
                    "fecha":         _formatear_fecha_db(fecha) if fecha else None,
                    "hora":          _formatear_hora_db(hora)   if hora  else None,
                    "distribuidor":  f"{item.legajo or ''} - {item.distribuidor or ''}".strip(),
                    "dni":           dni_valor, 
                    "aclaracion":    aclaracion_valor, 
                    "vinculo":       obs.get("vinculo",    ""),
                    "referencia1":   obs.get("referencia1", ""),
                    "referencia2":   obs.get("referencia2", ""),
                    "referencia3":   obs.get("referencia3", ""),
                    "descripcion":   DESCRIPCION_MAP.get(estado),
                    "foto":          foto_base64,
                    "firma":         firma_base64,
                    "geo":           item.geoVisita,
                    "segundaVisita": segunda_visita,
                    "tipoEntrega":   TIPO_ENTREGA_MAP.get(estado),
                })

            all_acuses.sort(key=lambda x: x["nroCliente"])
            return jsonify({"acusesData": all_acuses}), 200

    except Exception as e:
        print(e)
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500

@acuses.route('/api/acuses/getAcusesPorExcel', methods=['POST'])
@jwt_required()
def getAcusesPorExcel():
    try:
        data = request.get_json()
        if not data or 'nrosClientes' not in data:
            return jsonify({"message": "Debe proporcionar la lista de números de cliente"}), 400

        nros_clientes = data['nrosClientes']
        if not nros_clientes or len(nros_clientes) == 0:
            return jsonify({"message": "La lista de clientes está vacía"}), 400

        if len(nros_clientes) > 100:
            return jsonify({"message": "Máximo 100 clientes permitidos"}), 400

        estados_validos = ['DV', 'DR', 'DM', 'F AD', 'F ZP AD', '1° ZP', 'BP CR', 'ZPBP', 'UZP']

        def parse_obs_visita(obs):
            datos = {"dni": None, "aclaracion": None, "vinculo": None, "referencia1": None, "referencia2": None, "referencia3": None}
            if not obs:
                return datos
            dni_match = re.search(r"DNI:\s*([\d\s]+)", obs)
            nombre_match = re.search(r"NOMBRE Y APELLIDO:\s*([^,]+)", obs)
            vinculo_match = re.search(r"VINCULO:\s*([^,]+)", obs)

            def ref_con_color(n):
                ref = re.search(rf"{n}° REFERENCIA:\s*([^,]+)", obs)
                color = re.search(rf"{n}° COLOR:\s*([^,]+)", obs)
                if ref:
                    ref_text = ref.group(1).strip()
                    color_text = color.group(1).strip() if color else ""
                    return f"{ref_text} {color_text}" if color_text else ref_text
                return None

            if dni_match:
                datos["dni"] = re.sub(r"\D", "", dni_match.group(1))
            if nombre_match:
                datos["aclaracion"] = nombre_match.group(1).strip()
            if vinculo_match:
                datos["vinculo"] = vinculo_match.group(1).strip()
            datos["referencia1"] = ref_con_color(1)
            datos["referencia2"] = ref_con_color(2)
            datos["referencia3"] = ref_con_color(3)
            return datos

        def encode_image_to_base64(url, quality=40, resize_factor=0.5): 
            if not url:
                return None
                
            try:
                response = requests.get(url, timeout=5)
                if response.status_code != 200:
                    return None

                image = Image.open(BytesIO(response.content))

                new_size = (
                    int(image.width * resize_factor),
                    int(image.height * resize_factor)
                )
                image = image.resize(new_size, Image.LANCZOS)

                if image.mode in ("RGBA", "P"):
                    image = image.convert("RGB")

                buffer = BytesIO()
                image.save(buffer, format="JPEG", quality=quality, optimize=True)

                return base64.b64encode(buffer.getvalue()).decode("utf-8")

            except Exception as e:
                print(f"Error al comprimir imagen: {e}")
                return None

        with DatabaseSession().get_session() as session:
            todos_los_acuses = []
            clientes_sin_acuses = []

            for nro_cliente in nros_clientes:
                try:
                    # Obtener el último acuse del cliente
                    # Primero obtenemos los lotes del cliente
                    lotes_cliente = session.query(ItemEmision.lote).filter(
                        ItemEmision.nroCliente == nro_cliente,
                        ItemEmision.idGrupoCliente == 2,
                        ItemEmision.estadoPieza.in_(estados_validos),
                        ItemEmision.estadoMetro.is_(None)
                    ).distinct().subquery()

                    # Obtener el registro más reciente por fechaEmision
                    ultimo_acuse = session.query(ItemEmision).filter(
                        ItemEmision.nroCliente == nro_cliente,
                        ItemEmision.lote.in_(lotes_cliente)
                    ).order_by(ItemEmision.fechaEmision.desc()).first()

                    if not ultimo_acuse:
                        clientes_sin_acuses.append(nro_cliente)
                        continue

                    # Obtener NR si existe para este cliente en el mismo lote
                    nr_item = session.query(ItemEmision).filter(
                        ItemEmision.lote == ultimo_acuse.lote,
                        ItemEmision.estadoPieza == 'NR',
                        ItemEmision.nroCliente == nro_cliente
                    ).first()

                    # Parsear observaciones
                    obs = parse_obs_visita(ultimo_acuse.obsVisita, ultimo_acuse.estadoPieza)
                    estado = ultimo_acuse.estadoPieza

                    descripcion = (
                        "Otros" if estado == "DV" else
                        "Rehusado" if estado == "DR" else
                        "Se mudó" if estado == "DM" else None
                    )

                    tipo_entrega = (
                        "Bajo Puerta" if estado in ["1° ZP", "BP CR", "ZPBP", "UZP"] else
                        "Firmada" if estado in ["F AD", "F ZP AD"] else
                        "Otros" if estado == "DV" else
                        "Rehusado" if estado == "DR" else
                        "Se mudó" if estado == "DM" else None
                    )

                    segunda_visita = {}
                    fecha = ultimo_acuse.fechaDistrib
                    hora = ultimo_acuse.horaDistrib

                    if estado in ['1° ZP', 'BP CR', 'ZPBP', 'UZP']:
                        segunda_visita = {
                            "fecha2": ultimo_acuse.fechaDistrib,
                            "hora2": ultimo_acuse.horaDistrib
                        }
                        if nr_item:
                            fecha = nr_item.fechaDistrib
                            hora = nr_item.horaDistrib

                    foto_base64 = encode_image_to_base64(ultimo_acuse.foto) if ultimo_acuse.foto else None
                    firma_base64 = encode_image_to_base64(ultimo_acuse.firma) if ultimo_acuse.firma else None

                    acuse = {
                        "importe": ultimo_acuse.importe,
                        "fechaEmision": ultimo_acuse.fechaEmision,
                        "vencimiento": ultimo_acuse.vencimiento,
                        "nroCliente": ultimo_acuse.nroCliente,
                        "medidor": ultimo_acuse.medidor,
                        "nombreCliente": ultimo_acuse.titular,
                        "comprobante": ultimo_acuse.comprobante,
                        "direccion": f"{ultimo_acuse.calle or ''} {ultimo_acuse.altura or ''}".strip(),
                        "entreCalle": ultimo_acuse.entreCalles,
                        "codigoPostal": f"{ultimo_acuse.codigoPostal or ''} - {ultimo_acuse.localidad or ''}".strip(),
                        "codigoBarras": ultimo_acuse.codigoBarras,
                        "fecha": fecha,
                        "hora": hora,
                        "distribuidor": f"{ultimo_acuse.legajo or ''} - {ultimo_acuse.distribuidor or ''}".strip(),
                        "dni": obs.get("dni", ""),
                        "aclaracion": obs["aclaracion"],
                        "vinculo": obs["vinculo"],
                        "referencia1": obs["referencia1"],
                        "referencia2": obs["referencia2"],
                        "referencia3": obs["referencia3"],
                        "descripcion": descripcion,
                        "foto": foto_base64,
                        "firma": firma_base64,
                        "geo": ultimo_acuse.geoVisita,
                        "segundaVisita": segunda_visita,
                        "tipoEntrega": tipo_entrega,
                        "lote": ultimo_acuse.lote
                    }

                    todos_los_acuses.append(acuse)

                except Exception as e:
                    print(f"Error procesando cliente {nro_cliente}: {e}")
                    clientes_sin_acuses.append(nro_cliente)
                    continue

            return jsonify({
                "success": True,
                "acusesData": todos_los_acuses,
                "clientesSinAcuses": clientes_sin_acuses,
                "totalGenerados": len(todos_los_acuses),
                "totalNoEncontrados": len(clientes_sin_acuses)
            }), 200

    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": f"Error al procesar: {str(e)}"}), 500