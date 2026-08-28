import os
import pandas as pd
import json
from flask import Blueprint, jsonify, request, current_app, json
from sqlalchemy.sql import text
from db.masterRepo import DatabaseSession
from datetime import datetime, timedelta
import pymysql
from flask_jwt_extended import jwt_required
from utils.auth_helpers import get_current_grupo_cliente

radioCliente = Blueprint('radioCliente', __name__)

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
        return '-'
    
    try:
        anio = date_str[2:4]
        mes = date_str[5:7]
        dia = date_str[8:10]

        nuevaFecha = dia + "/" + mes + "/" + anio

    except ValueError:
        return None
    
    return nuevaFecha

@radioCliente.route('/api/radio-cliente', methods=['GET'])
@jwt_required()
def tablaRC():
    fechaEmision  = request.args.get('fechaEmision',  '')
    plan          = request.args.get('plan',          '')
    sucursal      = request.args.get('sucursal',      '')
    radio         = request.args.get('radio',         '')
    fechaDesde    = request.args.get('fechaDesde',    '')
    fechaHasta    = request.args.get('fechaHasta',    '')
    grupoCliente  = get_current_grupo_cliente() or ''

    try:
        # 1. SELECT solo las columnas necesarias, directo sobre la tabla base
        #    Evita el SELECT * y el row_number() OVER () de la view
        queryBase = """
            SELECT
                ie.id,
                ie."fechaEmision",
                gc.nombre            AS "grupoCliente",
                ie."nroCliente",
                ie.titular,
                ie."planTurno",
                ie.sucursal,
                ie.radio,
                concat(ie.calle, ' ', ie.altura) AS direccion,
                ie.localidad,
                ie."fechaCertificacion",
                ie."horaDistrib"     AS hora,
                ie."estadoPieza",
                ie."obsVisita",
                ie."geoVisita",
                ie.foto,
                ie.firma,
                ie.legajo
            FROM "itemEmision" ie
            JOIN "grupoCliente" gc ON ie."idGrupoCliente" = gc.id
        """

        where_clauses = []
        qParams = {}

        if grupoCliente and grupoCliente != 'null':
            where_clauses.append('ie."idGrupoCliente" = :grupoCliente')
            qParams['grupoCliente'] = grupoCliente

        if plan:
            where_clauses.append('ie."planTurno" = :plan')
            qParams['plan'] = plan

        if sucursal:
            where_clauses.append('ie.sucursal = :sucursal')
            qParams['sucursal'] = sucursal

        if radio:
            where_clauses.append('ie.radio = :radio')
            qParams['radio'] = radio

        if fechaEmision:
            where_clauses.append('ie."fechaEmision" = :fechaEmision')
            qParams['fechaEmision'] = fechaEmision

        if fechaDesde and fechaHasta:
            where_clauses.append('ie."fechaCertificacion" BETWEEN :fechaDesde AND :fechaHasta')
            qParams['fechaDesde'] = fechaDesde
            qParams['fechaHasta'] = fechaHasta
        elif fechaDesde:
            where_clauses.append('ie."fechaCertificacion" >= :fechaDesde')
            qParams['fechaDesde'] = fechaDesde
        elif fechaHasta:
            where_clauses.append('ie."fechaCertificacion" <= :fechaHasta')
            qParams['fechaHasta'] = fechaHasta

        if where_clauses:
            queryBase += ' WHERE ' + ' AND '.join(where_clauses)

        # 2. Construir los dicts DENTRO de la sesión activa
        with DatabaseSession().get_session() as session:
            rows = session.execute(text(queryBase), qParams).fetchall()

        if not rows:
            return jsonify({"message": "Recursos no encontrados"}), 404

        # 3. List comprehension en lugar de loop con append
        datosPiezasPostales = [
            {
                'id':           row.id,
                'fechaEmision': format_date(row.fechaEmision),
                'grupoCliente': row.grupoCliente,
                'nroCliente':   row.nroCliente,
                'titular':      row.titular,
                'plan':         row.planTurno,
                'sucursal':     row.sucursal,
                'radio':        row.radio,
                'direccion':    row.direccion,
                'localidad':    row.localidad,
                'fecha':        format_date(row.fechaCertificacion),
                'hora':         format_time(row.hora),
                'estadoPieza':  row.estadoPieza,
                'obsVisita':    row.obsVisita,
                'geoVisita':    row.geoVisita,
                'foto':         row.foto,
                'firma':        row.firma,
                'legajo':       row.legajo,
            }
            for row in rows
        ]

        keys = list(datosPiezasPostales[0].keys())
        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500

@radioCliente.route( '/api/radio/geoMapaItems', methods=['GET'])
@jwt_required()
def mapaItems():
    plan = request.args.get('plan')
    sucursal = request.args.get('sucursal')
    radio = request.args.get('radio')
    fechaDesde = request.args.get('fechaDesde')
    fechaHasta = request.args.get('fechaHasta')
    grupoCliente = get_current_grupo_cliente()
    fechaEmision = request.args.get('fechaEmision')

    try:        
        queryBase = 'SELECT * FROM "geoItemEmision" gie'

        where_clauses = []
        qParams = {}

        if grupoCliente:
            where_clauses.append('gie."idGrupoCliente" = :grupoCliente')
            qParams['grupoCliente'] = grupoCliente

        if plan:
            where_clauses.append('gie."planTurno" = :plan')
            qParams['plan'] = plan
        
        if sucursal:
            where_clauses.append('gie."sucursal" = :sucursal')
            qParams['sucursal'] = sucursal

        if radio:
            where_clauses.append('gie."radio" = :radio')
            qParams['radio'] = radio

        # Verifica si se proporcionan ambos parámetros de fecha para usar BETWEEN
        if fechaDesde and fechaHasta :
            where_clauses.append('gie."fechaCertificacion" BETWEEN :fechaDesde AND :fechaHasta')
            qParams['fechaDesde'] = fechaDesde
            qParams['fechaHasta'] = fechaHasta
        elif fechaDesde:
            # Si solo se proporciona fechaDesde, busca desde esa fecha en adelante
            where_clauses.append('gie."fechaCertificacion" >= :fechaDesde')
            qParams['fechaDesde'] = fechaDesde
        elif fechaHasta:
            # Si solo se proporciona fechaHasta, busca hasta esa fecha
            where_clauses.append('gie."fechaCertificacion" <= :fechaHasta')
            qParams['fechaHasta'] = fechaHasta
        elif fechaEmision and fechaEmision != 'null':
            where_clauses.append('gie."fechaEmision" = :fechaEmision')
            qParams['fechaEmision'] = fechaEmision

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
                'planTurno': row.planTurno,
                'radio': row.radio,
                'sucursal': row.sucursal,
                'latitud': row.latitud,
                'longitud': row.longitud,
                'fecha': row.fechaDistrib,
                'hora': row.horaDistrib
            })

        if not datosPiezasPostales:
            return '{"message": "Recursos no encontrados"}', 204
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200
    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
    




@radioCliente.route( '/api/get-presentismo', methods=['GET'])
@jwt_required()
def obtener_presentismo():
    hini = request.args.get('hini') 
    hfin = request.args.get('hfin')
    legajo = request.args.get('legajo') 
    conn = pymysql.connect(host="emaservicios.cluster-carhqkyg8c9r.us-east-1.rds.amazonaws.com", user="admin", passwd="W2bu^N_iMpg2Lvt",db="ema_ruteo" )
    cursor = conn.cursor()

    legajo_query = f"SELECT id FROM ubicaciones WHERE legajo = '{legajo}' LIMIT 1"
    cursor.execute(legajo_query)
    result = cursor.fetchone()
    
    if result:
        nombre_tabla = "ubicaciones_" + result[0]
        result = []
        query = f"""
            SELECT * FROM {nombre_tabla}
                WHERE fecha BETWEEN '{hini}' AND '{hfin}' ORDER BY fecha ASC
            """
        cursor.execute(query)
        columns = cursor.description
        for value in cursor.fetchall():
            tmp = {}
            for (index, column) in enumerate(value):
                # Convierte la cadena JSON a una estructura de datos en Python
                if columns[index][0] == 'json' and column is not None:
                    tmp[columns[index][0]] = json.loads(column)
                else:
                    tmp[columns[index][0]] = column
            result.append(tmp)
    return jsonify(result)

    

@radioCliente.route( '/api/geoMapaCamino', methods=['GET'])
@jwt_required()
def mapaCamino():
    # Obtén los parámetros de la solicitud GET
    plan = request.args.get('plan')
    sucursal = request.args.get('sucursal')
    radio = request.args.get('radio')
    fechaDesde = request.args.get('fechaDesde')
    fechaHasta = request.args.get('fechaHasta')
    grupoCliente = get_current_grupo_cliente()

    try:
        # Query base
        queryBase = '''
        SELECT DISTINCT(d.*) 
        FROM "geoItemEmision" gie 
        JOIN dai d ON d."fecha" = gie."fechaDistrib" 
        AND d."legajoDist" = gie.legajo
        '''

        # Lista para agregar condiciones WHERE
        where_clauses = []
        qParams = {}

        # Filtra por grupoCliente
        if grupoCliente and grupoCliente.lower() != 'null':
            where_clauses.append('gie."idGrupoCliente" = :grupoCliente')
            qParams['grupoCliente'] = grupoCliente

        # Filtra por plan, sucursal y radio si están presentes
        if plan:
            where_clauses.append('gie."planTurno" = :plan')
            qParams['plan'] = plan
        if sucursal:
            where_clauses.append('gie.sucursal = :sucursal')
            qParams['sucursal'] = sucursal
        if radio:
            where_clauses.append('gie.radio = :radio')
            qParams['radio'] = radio

        # Manejo de las fechas con BETWEEN y condiciones adicionales
        if fechaDesde and fechaHasta:
            where_clauses.append('gie."fechaCertificacion" BETWEEN :fechaDesde AND :fechaHasta')
            qParams['fechaDesde'] = fechaDesde
            qParams['fechaHasta'] = fechaHasta
        elif fechaDesde:
            where_clauses.append('gie."fechaCertificacion" >= :fechaDesde')
            qParams['fechaDesde'] = fechaDesde
        elif fechaHasta:
            where_clauses.append('gie."fechaCertificacion" <= :fechaHasta')
            qParams['fechaHasta'] = fechaHasta

        # Agregar cláusula WHERE si hay condiciones
        where_clause = f" WHERE {' AND '.join(where_clauses)}" if where_clauses else ''
        order_clause = ' ORDER BY d."fecha", d."hora"'

        # Consulta final
        query = text(queryBase + where_clause + order_clause)

        # Ejecutar la consulta
        with DatabaseSession().get_session() as session:
            data_query = session.execute(query, qParams).fetchall()

        # Convertir resultados a diccionarios para JSON
        dataGeoCamino = [
            {
                'id': row.id,
                'idGrupoCliente': row.idGrupoCliente,
                'legajoDist': row.legajoDist,
                'fecha': row.fecha,
                'hora': row.hora,
                'latitud': row.latitud,
                'longitud': row.longitud
            } for row in data_query
        ]

        # Verificar si los datos están vacíos
        if not dataGeoCamino:
            return jsonify({"message": "Recursos no encontrados"}), 204

        # Obtener columnas para la respuesta
        keys = list(dataGeoCamino[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataGeoCamino": dataGeoCamino}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500



@radioCliente.route( '/api/geo-dai', methods=['GET'])
@jwt_required()
def get_dai_data():
    fechaini = request.args.get('hini')
    fechafin = request.args.get('hfin')
    legajo = request.args.get('legajo')

    fechaini_dt = datetime.fromisoformat(fechaini.replace('Z', '+00:00'))  # Convertir a datetime
    fechaini_menos_4 = fechaini_dt - timedelta(hours=4)  # Restar 4 horas

    # Si necesitas el formato de string original, convertir de vuelta a ISO 8601
    fechaini_final = fechaini_menos_4.isoformat()

    fechafin_dt = datetime.fromisoformat(fechafin.replace('Z', '+00:00'))  # Convertir a datetime
    fechafin_menos_2 = fechafin_dt - timedelta(hours=2)  # Restar 4 horas

    # Si necesitas el formato de string original, convertir de vuelta a ISO 8601
    fechafin_final = fechafin_menos_2.isoformat()

    print("PRUEBAAA", fechaini_final)  # '2024-10-08T09:50:00+00:00'
    print("PRUEBAAA", fechafin_final)  # '2024-10-08T09:50:00+00:00'

    query = text("""
        SELECT id, "idGrupoCliente", "legajoDist", fecha, hora, latitud, longitud, "descEstado", pushpin, 
               velocidad, altitud, odometro, "distReportada", direccion, "zonaGeo", "mensConductor"
        FROM public.dai
        WHERE (fecha || ' ' || hora)::timestamp BETWEEN :fechaini AND :fechafin
        AND "legajoDist" = :legajo
    """)

    try:
        with DatabaseSession().get_session() as session:
            data_query = session.execute(query, {"fechaini": fechaini_final, "fechafin": fechafin_final, "legajo": legajo}).fetchall()

        dataGeoCamino = [
            {
                'id': row.id,
                'legajoDist': row.legajoDist,
                'fecha': row.fecha,
                'hora': row.hora,
                'latitud': row.latitud,
                'longitud': row.longitud
            } for row in data_query
        ]

        if not dataGeoCamino:
            # Envía un JSON vacío en lugar de una respuesta 204
            return jsonify({"dataGeoCamino": [], "columns": []}), 200

        keys = list(dataGeoCamino[0].keys())

        print ("camino", dataGeoCamino)
        
        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataGeoCamino": dataGeoCamino}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


#jsonify lo que hace es convierte lo que trae de la base de datos a json
@radioCliente.route( '/api/plan', methods=['GET'])
@jwt_required()
def planRC():
    
    try:        
        query = text('SELECT DISTINCT("planTurno") FROM "itemEmision"')

        with DatabaseSession().get_session() as session:
            data_query = session.execute(query)
                
        datosPiezasPostales = []

        for row in data_query:
            datosPiezasPostales.append({
                'planTurno': row.planTurno
            })

        if not datosPiezasPostales:
            return '{"message": "Recursos no encontrados"}', 204
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataDropDwnPlan": datosPiezasPostales}), 200
    except Exception as e:
        print()
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500


#jsonify lo que hace es convierte lo que trae de la base de datos a json
@radioCliente.route( '/api/sucursal', methods=['GET'])
@jwt_required()
def sucursalRC():
    
    try:        
        query = text('SELECT DISTINCT("sucursal") FROM "itemEmision"')

        with DatabaseSession().get_session() as session:
            data_query = session.execute(query)
                
        datosPiezasPostales = []

        for row in data_query:
            datosPiezasPostales.append({
                'sucursal': row.sucursal
            })

        if not datosPiezasPostales:
            return '{"message": "Recursos no encontrados"}', 204
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataDropDwnSucursal": datosPiezasPostales}), 200
    except Exception as e:
        print()
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500


#jsonify lo que hace es convierte lo que trae de la base de datos a json
@radioCliente.route( '/api/radio', methods=['GET'])
@jwt_required()
def radioRC():
    try:        
        query = text('SELECT DISTINCT("radio") FROM "itemEmision"')

        with DatabaseSession().get_session() as session:
            data_query = session.execute(query)
                
        datosPiezasPostales = []

        for row in data_query:
            datosPiezasPostales.append({
                'radio': row.radio
            })

        if not datosPiezasPostales:
            return '{"message": "Recursos no encontrados"}', 204
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataDropDwnRadio": datosPiezasPostales}), 200
    except Exception as e:
        print()
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500




