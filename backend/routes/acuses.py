from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache
from io import BytesIO
import json
from PIL import Image
from flask import Blueprint, jsonify, request, Response, stream_with_context
from sqlalchemy import text, cast, Text
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
            query = text('SELECT DISTINCT(lote) FROM "itemEmision" where "idGrupoCliente" = 2')
            data_query = session.execute(query)

            loteDropDown = [row.lote for row in data_query]

            if not loteDropDown:
                return jsonify([]), 204

        return jsonify(loteDropDown), 200

    except Exception as e:
        print(e)
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
    
def compress_and_encode_image(url, quality=40, resize_factor=0.5): 
    try:
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return None

        image = Image.open(BytesIO(response.content))

        # Redimensionar
        new_size = (
            int(image.width * resize_factor),
            int(image.height * resize_factor)
        )
        image = image.resize(new_size, Image.LANCZOS)

        # Convertir si tiene canal alfa
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Comprimir a JPEG
        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=quality, optimize=True)

        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    except Exception as e:
        print(f"Error al comprimir imagen: {e}")
        return None
    
@lru_cache(maxsize=1024)
def cached_encode_url_image_to_base64(url):
    return compress_and_encode_image(url, quality=40, resize_factor=0.5)

def encode_multiple_images_parallel(urls):
    results = {}
    unique_urls = set(url for url in urls if url)

    with ThreadPoolExecutor(max_workers=25) as executor:
        future_to_url = {executor.submit(cached_encode_url_image_to_base64, url): url for url in unique_urls}
        for future in as_completed(future_to_url):
            url = future_to_url[future]
            results[url] = future.result()

    return results

@acuses.route('/api/acuses/getAcuses', methods=['GET'])
def getAcuses():
    try:
        lote_param = request.args.get('lote')
        nroCliente = request.args.get('nroCliente')

        if not lote_param and not nroCliente:
            return jsonify({"message": "Debe proporcionar al menos 'lote' o 'nroCliente'."}), 400

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
                datos["dni"] = re.sub(r"\D", "", dni_match.group(1))  # Elimina espacios y cualquier otro símbolo  
            if nombre_match:
                datos["aclaracion"] = nombre_match.group(1).strip()
            if vinculo_match:
                datos["vinculo"] = vinculo_match.group(1).strip()
            datos["referencia1"] = ref_con_color(1)
            datos["referencia2"] = ref_con_color(2)
            datos["referencia3"] = ref_con_color(3)
            return datos

        def process_in_batches(data, batch_size=500):
            for i in range(0, len(data), batch_size):
                yield data[i:i + batch_size]

        with DatabaseSession().get_session() as session:
            lotes = [lote_param] if lote_param else [
                r[0] for r in session.query(ItemEmision.lote)
                    .filter(ItemEmision.nroCliente == nroCliente, ItemEmision.idGrupoCliente == 2)
                    .distinct().all()
            ]

            if not lote_param:
                # MODO JSON COMPLETO
                all_acuses = []

            def generar_acuses(lote):
                query = session.query(ItemEmision).filter(
                    ItemEmision.lote == lote,
                    ItemEmision.estadoPieza.in_(estados_validos)
                )
                if nroCliente:
                    query = query.filter(ItemEmision.nroCliente == nroCliente)

                # ORDENAR POR nroCliente
                query = query.order_by(ItemEmision.nroCliente)
                
                resultados = query.all()
                nroClientes = list(set(item.nroCliente for item in resultados))
                registros_nr = session.query(ItemEmision).filter(
                    ItemEmision.lote == lote,
                    ItemEmision.estadoPieza == 'NR',
                    ItemEmision.nroCliente.in_(nroClientes)
                ).all()
                nr_por_cliente = {item.nroCliente: item for item in registros_nr}

                for batch in process_in_batches(resultados, 500):
                    batch_image_urls = [item.foto for item in batch if item.foto]
                    batch_signature_urls = [item.firma for item in batch if item.firma]
                    encoded_data = encode_multiple_images_parallel(batch_image_urls + batch_signature_urls)

                    lote_acuses = []
                    for item in batch:
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

                        lote_acuses.append({
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
                            "dni": obs["dni"] if obs.get("dni") else "",
                            "aclaracion": obs["aclaracion"],
                            "vinculo": obs["vinculo"],
                            "referencia1": obs["referencia1"],
                            "referencia2": obs["referencia2"],
                            "referencia3": obs["referencia3"],
                            "descripcion": descripcion,
                            "foto": encoded_data.get(item.foto),
                            "firma": encoded_data.get(item.firma),
                            "geo": item.geoVisita,
                            "segundaVisita": segunda_visita,
                            "tipoEntrega": tipo_entrega,
                        })

                    yield lote_acuses

            if lote_param:
                # MODO STREAMING
                def generate():
                    for lote in lotes:
                        for acuses_batch in generar_acuses(lote):
                            yield f"data:{json.dumps(acuses_batch)}\n\n"

                return Response(stream_with_context(generate()), mimetype='text/event-stream')

            else:
                # MODO JSON PLANO
                for lote in lotes:
                    for batch in generar_acuses(lote):
                        all_acuses.extend(batch)

                # ORDENAR LA LISTA FINAL POR nroCliente (por si hay múltiples lotes)
                all_acuses.sort(key=lambda x: x["nroCliente"])
                
                return jsonify({"acusesData": all_acuses}), 200

    except Exception as e:
        print(e)
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500