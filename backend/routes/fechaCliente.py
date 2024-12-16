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
                "FAD": "FAD",
                "NV": "NR",
                "UZP": "UZP",
                "ZP_CR_2": "ZP CR",
            },
            {
                "Empresa": "METROGAS",
                "ZP": "BAJO PUERTA",
                "BP_CR": "BAJO PUERTA",
                "FAD": "BAJO FIRMA",
                "NV": "NO RESPONDE LLAMADO",
                "UZP": "BAJO PUERTA",
                "ZP_CR_2": "BAJO PUERTA",
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