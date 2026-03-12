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

acuses = Blueprint('acuses', __name__)

@acuses.route('/api/acuses/loteDropDwn', methods=['GET'])
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

@acuses.route('/api/acuses/getAcuses', methods=['GET'])
def getAcuses():
    try:
        nroCliente = request.args.get('nroCliente')

        if not nroCliente:
            return jsonify({"message": "Debe proporcionar 'nroCliente'."}), 400

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

        with DatabaseSession().get_session() as session:
            # Obtener todos los lotes del cliente
            lotes = [
                r[0] for r in session.query(ItemEmision.lote)
                    .filter(ItemEmision.nroCliente == nroCliente, ItemEmision.idGrupoCliente == 2)
                    .distinct().all()
            ]

            all_acuses = []

            for lote in lotes:
                query = session.query(ItemEmision).filter(
                    ItemEmision.lote == lote,
                    ItemEmision.estadoPieza.in_(estados_validos),
                    ItemEmision.estadoMetro.is_(None),
                    ItemEmision.nroCliente == nroCliente
                ).order_by(ItemEmision.nroCliente)

                resultados = query.all()
                
                nroClientes = list(set(item.nroCliente for item in resultados))
                registros_nr = session.query(ItemEmision).filter(
                    ItemEmision.lote == lote,
                    ItemEmision.estadoPieza == 'NR',
                    ItemEmision.nroCliente.in_(nroClientes)
                ).all()
                nr_por_cliente = {item.nroCliente: item for item in registros_nr}

                for item in resultados:
                    obs = parse_obs_visita(item.obsVisita)
                    estado = item.estadoPieza

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
                    fecha = item.fechaDistrib
                    hora = item.horaDistrib

                    if estado in ['1° ZP', 'BP CR', 'ZPBP', 'UZP']:
                        segunda_visita = {
                            "fecha2": item.fechaDistrib,
                            "hora2": item.horaDistrib
                        }
                        nr_item = nr_por_cliente.get(item.nroCliente)
                        if nr_item:
                            fecha = nr_item.fechaDistrib
                            hora = nr_item.horaDistrib

                    # Procesar imágenes una por una
                    foto_base64 = encode_image_to_base64(item.foto) if item.foto else None
                    firma_base64 = encode_image_to_base64(item.firma) if item.firma else None

                    all_acuses.append({
                        "importe": item.importe,
                        "fechaEmision": item.fechaEmision,
                        "vencimiento": item.vencimiento,
                        "nroCliente": item.nroCliente,
                        "medidor": item.medidor,
                        "nombreCliente": item.titular,
                        "comprobante": item.comprobante,
                        "direccion": f"{item.calle or ''} {item.altura or ''}".strip(),
                        "entreCalle": item.entreCalles,
                        "codigoPostal": f"{item.codigoPostal or ''} - {item.localidad or ''}".strip(),
                        "codigoBarras": item.codigoBarras,
                        "fecha": fecha,
                        "hora": hora,
                        "distribuidor": f"{item.legajo or ''} - {item.distribuidor or ''}".strip(),
                        "dni": obs.get("dni", ""),
                        "aclaracion": obs["aclaracion"],
                        "vinculo": obs["vinculo"],
                        "referencia1": obs["referencia1"],
                        "referencia2": obs["referencia2"],
                        "referencia3": obs["referencia3"],
                        "descripcion": descripcion,
                        "foto": foto_base64,
                        "firma": firma_base64,
                        "geo": item.geoVisita,
                        "segundaVisita": segunda_visita,
                        "tipoEntrega": tipo_entrega,
                    })

            # ORDENAR LA LISTA FINAL POR nroCliente
            all_acuses.sort(key=lambda x: x["nroCliente"])
            
            return jsonify({"acusesData": all_acuses}), 200

    except Exception as e:
        print(e)
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500

@acuses.route('/api/acuses/getAcusesPorExcel', methods=['POST'])
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
                    obs = parse_obs_visita(ultimo_acuse.obsVisita)
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