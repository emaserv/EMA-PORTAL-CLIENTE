from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache
import json
from flask import Blueprint, jsonify, request
from sqlalchemy import text, cast, Text
from db.masterRepo import DatabaseSession
from models.emision.ItemEmision import ItemEmision
import re
import base64
import requests
from PIL import Image
from io import BytesIO

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
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
    
from PIL import Image
from io import BytesIO
import base64
import requests
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor, as_completed

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


# def encode_multiple_images_parallel(urls):
#     results = {}
#     unique_urls = set(url for url in urls if url)
    
#     with ThreadPoolExecutor(max_workers=25) as executor:
#         future_to_url = {executor.submit(cached_encode_url_image_to_base64, url): url for url in unique_urls}
#         for future in as_completed(future_to_url):
#             url = future_to_url[future]
#             results[url] = future.result()
    
#     return results

@acuses.route('/api/acuses/getAcuses', methods=['GET'])
def getAcuses():
    try:
        lote = request.args.get('lote')
        nroCliente = request.args.get('nroCliente')

        if not lote:
            return jsonify({"message": "El parámetro 'lote' es obligatorio."}), 400

        estados_validos = ['DV', 'DR', 'DM', 'F AD', 'F ZP AD', '1° ZP', 'BP CR', 'ZPBP', 'UZP']

        with DatabaseSession().get_session() as session:
            query = session.query(ItemEmision).filter(
                ItemEmision.lote == lote,
                ItemEmision.estadoPieza.in_(estados_validos)
            )

            if nroCliente:
                query = query.filter(ItemEmision.nroCliente == nroCliente)

            resultados = query.all()

            # Busco posibles registros con estado NR por cliente y lote
            nroClientes = list(set(item.nroCliente for item in resultados))
            nr_query = session.query(ItemEmision).filter(
                ItemEmision.lote == lote,
                ItemEmision.estadoPieza == 'NR',
                ItemEmision.nroCliente.in_(nroClientes)
            )
            registros_nr = nr_query.all()

            # Indexar por nroCliente para acceder más fácil
            nr_por_cliente = {
                item.nroCliente: item for item in registros_nr
            }

            def parse_obs_visita(obs):
                datos = {
                    "dni": None,
                    "aclaracion": None,
                    "vinculo": None,
                    "referencia1": None,
                    "referencia2": None,
                    "referencia3": None
                }

                if not obs:
                    return datos

                # Expresiones regulares para cada dato
                dni_match = re.search(r"DNI:\s*(\d+)", obs)
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

                # Guardamos los datos extraídos
                if dni_match:
                    datos["dni"] = dni_match.group(1)
                if nombre_match:
                    datos["aclaracion"] = nombre_match.group(1).strip()
                if vinculo_match:
                    datos["vinculo"] = vinculo_match.group(1).strip()

                datos["referencia1"] = ref_con_color(1)
                datos["referencia2"] = ref_con_color(2)
                datos["referencia3"] = ref_con_color(3)

                return datos
            
            # Función para procesar en lotes
            def process_in_batches(data, batch_size=500):
                for i in range(0, len(data), batch_size):
                    batch = data[i:i + batch_size]
                    yield batch

            acusesData = []

            all_image_urls = []
            all_signature_urls = []

            # Procesamos los resultados en lotes de 100
            for batch in process_in_batches(resultados, 500):
                # Pre-procesar URLs del batch actual
                batch_image_urls = []
                batch_signature_urls = []
                for item in batch:
                    if item.foto: batch_image_urls.append(item.foto)
                    if item.firma: batch_signature_urls.append(item.firma)
                
                # Codificar imágenes del batch en paralelo
                encoded_data = encode_multiple_images_parallel(batch_image_urls + batch_signature_urls)

                for item in batch:
                    obs = parse_obs_visita(item.obsVisita)
                    estado = item.estadoPieza
                    descripcion = (
                        "Otros" if estado == "DV" else
                        "Rehusado" if estado == "DR" else
                        "Se mudó" if estado == "DM" else
                        None
                    )

                    tipo_entrega = (
                        "Bajo Puerta" if estado in ["1° ZP", "BP CR", "ZPBP", "UZP"] else
                        "Firmada" if estado in ["F AD", "F ZP AD"] else
                        "Otros" if estado == "DV" else
                        "Rehusado" if estado == "DR" else
                        "Se mudó" if estado == "DM" else
                        None
                    )

                    segunda_visita = {}
                    fecha = item.fechaDistrib
                    hora = item.horaDistrib

                    if estado in ['1° ZP', 'BP CR', 'ZPBP', 'UZP']:
                        segunda_visita = {
                            "fecha2": item.fechaDistrib,
                            "hora2": item.horaDistrib
                        }

                        # Si hay un NR con mismo cliente y lote, reemplazar fecha y hora principales
                        nr_item = nr_por_cliente.get(item.nroCliente)
                        if nr_item:
                            fecha = nr_item.fechaDistrib
                            hora = nr_item.horaDistrib

                    acusesData.append({
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
                        "dni": obs["dni"],
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
                    total=len(acusesData)
        return jsonify({"message": "Conexión y consulta exitosas", "acusesData": acusesData, "totalAcuses":total})

    except Exception as e:
        print(e)
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500