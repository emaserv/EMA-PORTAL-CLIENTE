import json
from flask import Blueprint, jsonify, request
from sqlalchemy import text, cast, Text
from db.masterRepo import DatabaseSession
from models.geoJson.GeoJson import GeoJson

geoJson = Blueprint('geoJson', __name__)

@geoJson.route('/api/geoJson/consultarGeoJson', methods=['POST'])
def getGeoJson():
    try:
        plan = request.args.get('plan')
        sucursal = request.args.get('sucursal')
        radio = request.args.get('radio')
        antiguedad = request.args.get('antiguedad')

        # Validar que al menos un parámetro esté presente
        if not any([plan, sucursal, radio]):
            return jsonify({"message": "Se requiere al menos un parámetro: 'plan', 'sucursal' o 'radio'"}), 400

        with DatabaseSession().get_session() as session:
            # Construir query dinámicamente según los parámetros proporcionados
            query = session.query(GeoJson)
            
            # Construir filtros basados en los parámetros proporcionados
            filters = []
            
            if sucursal and plan and radio:
                # Caso: todos los parámetros - búsqueda exacta
                nombre_buscar = f"{sucursal}-{plan}-{radio}"
                filters.append(GeoJson.nombre == nombre_buscar)
            else:
                # Caso: combinaciones parciales - búsqueda con LIKE
                if sucursal:
                    filters.append(GeoJson.nombre.like(f"{sucursal}-%"))
                if plan:
                    if sucursal:
                        filters.append(GeoJson.nombre.like(f"%-{plan}-%"))
                    else:
                        filters.append(GeoJson.nombre.like(f"%-{plan}-%"))
                if radio:
                    if sucursal or plan:
                        filters.append(GeoJson.nombre.like(f"%-{radio}"))
                    else:
                        filters.append(GeoJson.nombre.like(f"%-{radio}"))

            # Aplicar filtro de antigüedad si está presente
            if antiguedad:
                if antiguedad not in ['Viejo', 'Nuevo']:
                    return jsonify({"message": "El parámetro 'antiguedad' debe ser 'Viejo' o 'Nuevo'"}), 400
                filters.append(GeoJson.antiguedad == antiguedad)

            # Aplicar todos los filtros
            for filter_condition in filters:
                query = query.filter(filter_condition)

            # Ejecutar consulta
            geojsons = query.all()
                        
            if not geojsons:
                return jsonify({'error': 'No se encontraron GeoJson con los criterios especificados'}), 404

            # Procesar múltiples resultados
            results = []
            for geojson in geojsons:
                geojson_data = geojson.geoData.decode('utf-8')
                
                # EXTRAER EL RADIO DEL NOMBRE para poder agrupar en el frontend
                nombre_partes = geojson.nombre.split('-')
                radio_extraido = nombre_partes[2] if len(nombre_partes) >= 3 else "desconocido"
                
                # Crear el objeto con toda la metadata necesaria
                result_item = {
                    "nombre": geojson.nombre,
                    "sucursal": nombre_partes[0] if len(nombre_partes) >= 1 else "",
                    "plan": nombre_partes[1] if len(nombre_partes) >= 2 else "",
                    "radio": radio_extraido,  # ← NUEVO: Incluir el radio extraído
                    "antiguedad": geojson.antiguedad,
                    "geoData": json.loads(geojson_data)
                }
                results.append(result_item)

            # SIEMPRE devolver la estructura con metadata para que el frontend pueda agrupar por radio
            return jsonify({
                "message": f"Se encontraron {len(results)} resultados", 
                "geoData": [result["geoData"] for result in results],
                "metadata": results,  # ← ENVIAR TODA LA METADATA
                "radios_unicos": list(set([r['radio'] for r in results]))  # ← Para debug
            })

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        print(f"❌ TRACEBACK: {traceback.format_exc()}")
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500


@geoJson.route('/api/geoJson/agregarGeoJson', methods=['POST'])
def agregarGeoJson():
    try:
        import os

        CARPETA = "./GEO"

        nuevos = 0
        existentes = 0
        contador = 0

        with DatabaseSession().get_session() as session:
            archivos = os.listdir(CARPETA)
            total_archivos = len(archivos)
            
            for archivo in archivos:
                contador += 1
                print(f"Procesando archivo {contador} de {total_archivos}: {archivo}")
                
                if archivo.endswith(".geojson"):
                    nombre_sin_extension = os.path.splitext(archivo)[0]

                    # Verificar si ya existe en la base
                    existe = session.query(GeoJson).filter_by(nombre=nombre_sin_extension).first()
                    if existe:
                        existentes += 1
                        continue

                    # Leer el archivo
                    ruta_archivo = os.path.join(CARPETA, archivo)
                    with open(ruta_archivo, 'rb') as f:
                        contenido = f.read()

                    # Insertar en la tabla
                    nuevo_geojson = GeoJson(nombre=nombre_sin_extension, geoData=contenido)
                    session.add(nuevo_geojson)
                    nuevos += 1

            session.commit()

        return jsonify({
            "message": "Proceso finalizado",
            "archivos_agregados": nuevos,
            "archivos_existentes": existentes
        })

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
