import os
import pandas as pd
import json
from flask import Blueprint, jsonify, request, current_app, json
from sqlalchemy.sql import text
from db.masterRepo import DatabaseSession
from datetime import datetime
import requests

fechaCliente = Blueprint('fechaCliente', __name__)

def get_column_names(model):
    return [column.name for column in model.__table__.columns]

def format_time(time_str):
    if time_str is None:
        return None

    try:
        # Intenta parsear con formato de horas:minutos:segundos
        dt = datetime.strptime(time_str, '%H:%M:%S')
    except ValueError:
        try:
            # Intenta parsear con formato de horas:minutos:segundos:milisegundos
            dt = datetime.strptime(time_str, '%H:%M:%S.%f')
        except ValueError:
            # Si el formato no es válido, lanza un error
            return None

    # Devuelve solo horas y minutos en formato HH:MM
    return dt.strftime('%H:%M')

def format_date(date_str):
    if date_str is None:
        return None
    
    try:
        anio = date_str[2:4]
        mes = date_str[5:7]
        dia = date_str[8:10]

        nuevaFecha = dia + "/" + mes + "/" + anio

    except ValueError:
        return None
    
    return nuevaFecha

def format_date_para_url(date_str):
    if date_str is None:
        return None
    
    try:
        anio = date_str[2:4]
        mes = date_str[5:7]
        dia = date_str[8:10]

        nuevaFecha = dia + mes + "20" + anio

    except ValueError:
        return None
    
    return nuevaFecha

def fetch_data(nroCliente, fechaEmision):
    url = f"https://metrogasdocs2.docuprint.com/Api/Form/{nroCliente}/{fechaEmision}"
    try:
        response = requests.get(url)
        response.raise_for_status()  # Verifica si hubo un error en la solicitud
        data = response.json()  # Si la respuesta es JSON, la devuelve como un diccionario
        # Asegurarse de que la clave 'Url' existe en la respuesta
        if data:
            return data
        else:
            print("La respuesta se encuentra vacia.")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error al hacer la solicitud: {e}")
        return None


@fechaCliente.route('/api/fecha-cliente', methods=['GET'])
def tablaFC():
    numeroCliente = request.args.get('cliente')
    fechaDesde = request.args.get('fechaDesde')
    fechaHasta = request.args.get('fechaHasta')
    grupoCliente = request.args.get('grupoCliente')

    try:
        queryBase = 'SELECT * FROM "fechaCliente" fc'
        
        where_clauses = []
        qParams = {}

        # Verificar y agregar los parámetros condicionalmente
        if grupoCliente and grupoCliente != 'null':
            where_clauses.append('fc."idGrupoCliente" = :grupoCliente')
            qParams['grupoCliente'] = grupoCliente

        if numeroCliente:
            where_clauses.append('fc."nroCliente" = :numeroCliente')
            qParams['numeroCliente'] = numeroCliente

        if fechaDesde and fechaHasta:
            where_clauses.append('fc."fecha" BETWEEN :fechaDesde AND :fechaHasta')
            qParams['fechaDesde'] = fechaDesde
            qParams['fechaHasta'] = fechaHasta
        elif fechaDesde:
            where_clauses.append('fc."fecha" >= :fechaDesde')
            qParams['fechaDesde'] = fechaDesde
        elif fechaHasta:
            where_clauses.append('fc."fecha" <= :fechaHasta')
            qParams['fechaHasta'] = fechaHasta

        # Combinar cláusulas WHERE si existen
        if where_clauses:
            where_clause = ' WHERE ' + ' AND '.join(where_clauses)
            query = queryBase + where_clause
        else:
            query = queryBase

        # Agregar cláusula ORDER BY
        query += ' ORDER BY fc."nroCliente", fc."fecha" DESC'

        # Convertir a TextClause después de armar la consulta completa
        query = text(query)

        # Ejecutar la consulta
        with DatabaseSession().get_session() as session:
            data_query = session.execute(query, qParams)
            session.commit()

        datosPiezasPostales = []

        for row in data_query:
            datosPiezasPostales.append({
                'id': row.id,
                'fechaEmision': format_date(row.fechaEmision),
                'fechaVencimiento': fetch_data(row.nroCliente, format_date_para_url(row.fechaEmision))["Vencimiento"],
                'grupoCliente': row.grupoCliente,
                'nroCliente': row.nroCliente,
                'titular': row.titular,
                'plan': row.planTurno,
                'sucursal': row.sucursal,
                'radio': row.radio,
                'direccion': row.direccion,
                'localidad': row.localidad,
                'fecha': format_date(row.fecha),
                'hora': format_time(row.hora),  # Usa la función de formateo aquí
                'importe': str("${:,.2f}".format(fetch_data(row.nroCliente, format_date_para_url(row.fechaEmision))["Importe"])),
                'estadoPieza': row.estadoPieza,
                'estadoMetro': row.estadoMetro,
                'obsVisita': row.obsVisita,
                'geoVisita': row.geoVisita,
                'foto': row.foto,
                'firma': row.firma,
                'acuseDeDeuda': fetch_data(row.nroCliente, format_date_para_url(row.fechaEmision))["Url"]
            })
            
        print(datosPiezasPostales)

        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 204

        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500


@fechaCliente.route('/api/fecha/geoMapaItems', methods=['GET'])
def mapaItems():
    numeroCliente = request.args.get('cliente')
    fechaDesde = request.args.get('fechaDesde')
    fechaHasta = request.args.get('fechaHasta')
    grupoCliente = request.args.get('grupoCliente')

    try:        
        queryBase = 'SELECT * FROM "geoItemEmision" gie'

        where_clauses = []
        qParams = {}

        if grupoCliente:
            where_clauses.append('gie."idGrupoCliente" = :grupoCliente')
            qParams['grupoCliente'] = grupoCliente

        if numeroCliente != '':
            where_clauses.append('gie."nroCliente" = :numeroCliente')
            qParams['numeroCliente'] = numeroCliente

        # Verifica si se proporcionan ambos parámetros de fecha para usar BETWEEN
        if fechaDesde and fechaHasta :
            where_clauses.append('gie."fechaDistrib" BETWEEN :fechaDesde AND :fechaHasta')
            qParams['fechaDesde'] = fechaDesde
            qParams['fechaHasta'] = fechaHasta
        elif fechaDesde:
            # Si solo se proporciona fechaDesde, busca desde esa fecha en adelante
            where_clauses.append('gie."fechaDistrib" >= :fechaDesde')
            qParams['fechaDesde'] = fechaDesde
        elif fechaHasta:
            # Si solo se proporciona fechaHasta, busca hasta esa fecha
            where_clauses.append('gie."fechaDistrib" <= :fechaHasta')
            qParams['fechaHasta'] = fechaHasta

        if where_clauses:
            where_clause = ' WHERE ' + ' AND '.join(where_clauses)
            query = text(queryBase + where_clause)
        else:
            query = text(queryBase)

        with DatabaseSession().get_session() as session:
            data_query = session.execute(query, qParams)
                
        datosPiezasPostales = []

        for row in data_query:
            datosPiezasPostales.append({
                'legajo': row.legajo,
                'nroCliente': row.nroCliente,
                'planTurno': row.planTurno,
                'radio': row.radio,
                'sucursal': row.sucursal,
                'latitud': row.latitud,
                'longitud': row.longitud,
                'fecha': row.fechaDistrib
            })

        if not datosPiezasPostales:
            return '{"message": "Recursos no encontrados"}', 204
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200
    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500

#jsonify lo que hace es convierte lo que trae de la base de datos a json
@fechaCliente.route('/api/nroCliente', methods=['GET'])
def nroClienteFC():
    
    try:        
        query = text('SELECT DISTINCT("nroCliente") FROM "fechaCliente"')

        with DatabaseSession().get_session() as session:
            data_query = session.execute(query)
                
        datosPiezasPostales = []

        for row in data_query:
            datosPiezasPostales.append({
                'nroCliente': row.nroCliente
            })

        if not datosPiezasPostales:
            return '{"message": "Recursos no encontrados"}', 204
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataDropDwn": datosPiezasPostales}), 200
    except Exception as e:
        print()
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500


#jsonify lo que hace es convierte lo que trae de la base de datos a json
@fechaCliente.route('/api/tablaInformacion', methods=['GET'])
def tablaInformacion():
    try:
        # Datos de ejemplo en la consulta
        data_query = [
            {
                "Empresa": "EMA",
                "ZP": "1° ZP",
                "BP_CR": "BP CR",
                "FAD": "F AD",
                "NV": "NR",
                "UZP": "UZP",
                "ZP_CR_2": "ZP CR",
                "6_DEV": "6 DEV"
            },
            {
                "Empresa": "METROGAS",
                "ZP": "BAJO PUERTA",
                "BP_CR": "BAJO PUERTA",
                "FAD": "BAJO FIRMA",
                "NV": "NO RESPONDE LLAMADO",
                "UZP": "BAJO PUERTA",
                "ZP_CR_2": "BAJO PUERTA",
                "6_DEV": "DEVOLUCION",
            },
        ]
        
        datosPiezasPostales = []

        # Corregido: Acceso a los datos en el diccionario utilizando corchetes []
        for row in data_query:
            datosPiezasPostales.append({
                'Empresa': row['Empresa'],      # Corregido el acceso a los elementos del diccionario
                'ZP': row['ZP'],
                'BP_CR': row['BP_CR'],
                'FAD': row['FAD'],
                'NV': row['NV'],
                'UZP': row['UZP'],
                'ZP_CR_2': row['ZP_CR_2'],
                '6_DEV': row['6_DEV'],
            })

        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 204
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({
            "message": "Conexión y consulta exitosas", 
            "columns": keys, 
            "dataTabla": datosPiezasPostales
        }), 200

    except Exception as e:
        print(e)  # Corregido: Mostrar el error real en la consola
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
    

@fechaCliente.route('/api/emision-cliente', methods=['GET'])
def tablaEmision():
    idEmision = request.args.get('idEmision')
    print(idEmision)
    
    try:
        queryBase = 'SELECT * FROM "fechaCliente" fc'
        
        where_clauses = []
        qParams = {}

        # Verificar y agregar los parámetros condicionalmente
        if idEmision:
            where_clauses.append('fc."idEmision" = :idEmision')
            qParams['idEmision'] = idEmision

        # Combinar cláusulas WHERE si existen
        if where_clauses:
            where_clause = ' WHERE ' + ' AND '.join(where_clauses)
            query = queryBase + where_clause

        # Convertir a TextClause después de armar la consulta completa
        query = text(query)

        query_insert = text('INSERT INTO "itemEmision"("avisoMetro", "fechaVencimientoMetro", "importeMetro") VALUES(:urlAviso, :fechaVencimiento, :importe) WHERE id = :id')
        qParamsInsert = {}

        # Ejecutar la consulta
        with DatabaseSession().get_session() as session:
            data_query = session.execute(query, qParams)

        datosPiezasPostales = []
        cache_fetch = {}
        
        for row in data_query:
            
            if not (row.avisoDeuda and row.fechaVencimientoMetro and row.importeMetro):

                key = (row.nroCliente, format_date_para_url(row.fechaEmision))
                
                if key not in cache_fetch:
                    cache_fetch[key] = fetch_data(row.nroCliente, format_date_para_url(row.fechaEmision))
                    
                    qParamsInsert['urlAviso'] = cache_fetch[key]["Url"]
                    qParamsInsert['fechaVencimiento'] = cache_fetch[key]["Vencimiento"]
                    qParamsInsert['importe'] = cache_fetch[key]["Importe"]
                    qParamsInsert['id'] = row.id
                    
                    with DatabaseSession().get_session() as session:
                        query_insert = session.execute(query_insert, qParamsInsert)
            
                data = cache_fetch[key]
                datosPiezasPostales.append({
                    'id': row.id,
                    'fechaEmision': format_date(row.fechaEmision),
                    'fechaVencimiento': data["Vencimiento"],
                    'nroCliente': row.nroCliente,
                    'titular': row.titular,
                    'plan': row.planTurno,
                    'sucursal': row.sucursal,
                    'radio': row.radio,
                    'direccion': row.direccion,
                    'localidad': row.localidad,
                    'fecha': format_date(row.fecha),
                    'hora': format_time(row.hora),
                    'importe': str("${:,.2f}".format(data["Importe"])),
                    'estadoPieza': row.estadoPieza,
                    'estadoMetro': row.estadoMetro,
                    'obsVisita': row.obsVisita,
                    'geoVisita': row.geoVisita,
                    'foto': row.foto,
                    'firma': row.firma,
                    'acuseDeDeuda': data["Url"]
                })

            else:
                datosPiezasPostales.append({
                    'id': row.id,
                    'fechaEmision': format_date(row.fechaEmision),
                    'fechaVencimiento': row.fechaVencimientoMetro,
                    'nroCliente': row.nroCliente,
                    'titular': row.titular,
                    'plan': row.planTurno,
                    'sucursal': row.sucursal,
                    'radio': row.radio,
                    'direccion': row.direccion,
                    'localidad': row.localidad,
                    'fecha': format_date(row.fecha),
                    'hora': format_time(row.hora),
                    'importe': str("${:,.2f}".format(row.importeMetro)),
                    'estadoPieza': row.estadoPieza,
                    'estadoMetro': row.estadoMetro,
                    'obsVisita': row.obsVisita,
                    'geoVisita': row.geoVisita,
                    'foto': row.foto,
                    'firma': row.firma,
                    'acuseDeDeuda': row.avisoMetro
                })
            
        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 204

        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500

@fechaCliente.route('/api/emisiones', methods=['GET'])
def get_emisiones():
    idGrupoCliente = request.args.get('idGrupoCliente')

    try:
        queryBase = None
        
        if int(idGrupoCliente) == 4:  # Convertir a string para comparación segura
            queryBase = text('SELECT DISTINCT("fechaEmision") AS nombre, row_number() OVER () AS id FROM "informeClienteMetrogas" icm GROUP BY "fechaEmision" ORDER BY 1')
        elif int(idGrupoCliente) == 2:
            queryBase = text('SELECT DISTINCT("fechaEmision") AS nombre, row_number() OVER () AS id FROM "informeClienteNaturgy" icn GROUP BY "fechaEmision" ORDER BY 1')

        if queryBase is None:
            return jsonify({"message": "idGrupoCliente no válido"}), 400

        # Ejecutar la consulta
        with DatabaseSession().get_session() as session:
            data_query = session.execute(queryBase)

        datosPiezasPostales = [{"id": row.id, "nombre": row.nombre} for row in data_query]

        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 204

        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "multiplesEmision": datosPiezasPostales}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500


def buscar_por_id(data, id_buscado):
    for item in data:
        if str(item['id']) == id_buscado:
            return str(item['nombre'])
    return None


@fechaCliente.route('/api/informe-emision', methods=['GET'])
def informeEmision():
    idEmision = request.args.get('idEmision')
    idGrupoCliente = request.args.get('idGrupoCliente')
    
    try:
        if int(idGrupoCliente)  == 4:
            queryBaseSearch = text('SELECT DISTINCT("fechaEmision") AS nombre, row_number() OVER () AS id FROM "informeClienteMetrogas" icm GROUP BY "fechaEmision" ORDER BY 1')
        elif int(idGrupoCliente)  == 2:
            queryBaseSearch = text('SELECT DISTINCT("fechaEmision") AS nombre, row_number() OVER () AS id FROM "informeClienteNaturgy" icm GROUP BY "fechaEmision" ORDER BY 1')
        
        with DatabaseSession().get_session() as session:
            data_query_search = session.execute(queryBaseSearch)
        
        dataQueryBusqueda = []
        
        for row in data_query_search:
             dataQueryBusqueda.append({
                'id': row.id, 
                'nombre': row.nombre
            })
        
        fechaEncontrada = buscar_por_id(dataQueryBusqueda, idEmision)
        
        if int(idGrupoCliente) == 4:
            queryBase = 'SELECT * FROM "informeClienteMetrogas" icm'
        elif int(idGrupoCliente) == 2:
            queryBase = 'SELECT * FROM "informeClienteNaturgy" icn'
        
        where_clauses = []
        qParams = {}

        # Verificar y agregar los parámetros condicionalmente
        if idEmision and int(idGrupoCliente) == 4:
            where_clauses.append('icm."fechaEmision" = :fechaEmision')
            qParams['fechaEmision'] = fechaEncontrada
        elif idEmision and int(idGrupoCliente) == 2:
            where_clauses.append('icn."fechaEmision" = :fechaEmision')
            qParams['fechaEmision'] = fechaEncontrada

        # Combinar cláusulas WHERE si existen
        if where_clauses:
            where_clause = ' WHERE ' + ' AND '.join(where_clauses)
            query = queryBase + where_clause

        # Convertir a TextClause después de armar la consulta completa
        query = text(query + " ORDER BY count DESC")

        # Ejecutar la consulta
        with DatabaseSession().get_session() as session:
            data_query = session.execute(query, qParams)

        datosPiezasPostales = []
        
        for row in data_query:
            if int(idGrupoCliente) == 4:
                datosPiezasPostales.append({
                    'id': row.id, 
                    #'idEmision': row.idEmision,
                    'fechaEmision': row.fechaEmision,
                    'localidad': row.localidad,
                    'estadoPieza': row.estadoPieza,
                    'estadoMetro': row.estadoMetro,
                    'count': str(row.count),
                })
            elif int(idGrupoCliente) == 2:
                datosPiezasPostales.append({
                    'id': row.id, 
                    #'idEmision': row.idEmision,
                    'fechaEmision': row.fechaEmision,
                    'condicion': row.foto,
                    'estadoPieza': row.estadoPieza,
                    'count': str(row.count),
                })

        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 204

        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500


@fechaCliente.route('/api/informe-emision-extendido', methods=['GET'])
def informeEmisionExtendido():
    idEmision = request.args.get('idEmision')
    
    try:
        queryBaseSearch = text('SELECT DISTINCT("fechaEmision") AS nombre, row_number() OVER () AS id FROM "informeClienteMetrogas" icm GROUP BY "fechaEmision" ORDER BY 1')
        
        with DatabaseSession().get_session() as session:
            data_query_search = session.execute(queryBaseSearch)
        
        dataQueryBusqueda = []
        
        for row in data_query_search:
             dataQueryBusqueda.append({
                'id': row.id, 
                'nombre': row.nombre
            })
        
        fechaEncontrada = buscar_por_id(dataQueryBusqueda, idEmision)
        
        print(fechaEncontrada)
        
        queryBase = 'SELECT * FROM "fechaCliente" fc'
        
        where_clauses = []
        qParams = {}

        # Verificar y agregar los parámetros condicionalmente
        if idEmision:
            where_clauses.append('fc."fechaEmision" = :fechaEmision')
            qParams['fechaEmision'] = fechaEncontrada
            
            #where_clauses.append('fc."estadoPieza" != :estadoAnulado ')
            #qParams['estadoAnulado'] = 'NR'
    

        # Combinar cláusulas WHERE si existen
        if where_clauses:
            where_clause = ' WHERE ' + ' AND '.join(where_clauses)
            query = queryBase + where_clause

        # Convertir a TextClause después de armar la consulta completa
        query = text(query)

        # Ejecutar la consulta
        with DatabaseSession().get_session() as session:
            data_query = session.execute(query, qParams)

        datosPiezasPostales = []
        
        for row in data_query:
            
            datosPiezasPostales.append({
                'id': row.id,
                'fechaEmision': format_date(row.fechaEmision),
                'fechaVencimiento': row.fechaVencimientoMetro,
                'nroCliente': row.nroCliente,
                'titular': row.titular,
                'plan': row.planTurno,
                'sucursal': row.sucursal,
                'radio': row.radio,
                'direccion': row.direccion,
                'localidad': row.localidad,
                'fecha': format_date(row.fecha),
                'hora': format_time(row.hora),
                'estadoPieza': row.estadoPieza,
                'estadoMetro': row.estadoMetro,
                'obsVisita': row.obsVisita,
                'geoVisita': row.geoVisita,
                'foto': row.foto,
                'firma': row.firma
            })

        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 204

        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
