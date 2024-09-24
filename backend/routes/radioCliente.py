import os
import pandas as pd
import json
from flask import Blueprint, jsonify, request, current_app, json
from sqlalchemy.sql import text
from db.masterRepo import DatabaseSession

radioCliente = Blueprint('radioCliente', __name__)

def get_column_names(model):
    return [column.name for column in model.__table__.columns]

#jsonify lo que hace es convierte lo que trae de la base de datos a json
@radioCliente.route('/api/radio-cliente', methods=['GET'])
def tablaRC():
    plan = request.args.get('plan')
    sucursal = request.args.get('sucursal')
    radio = request.args.get('radio')
    fechaDesde = request.args.get('fechaDesde')
    fechaHasta = request.args.get('fechaHasta')
    grupoCliente = request.args.get('grupoCliente')
    
    try:        
        queryBase = 'SELECT * FROM "radioCliente" rc'

        where_clauses = []
        qParams = {}

        if grupoCliente != 'null':
            where_clauses.append('rc."idGrupoCliente" = :grupoCliente')
            qParams['grupoCliente'] = grupoCliente

        if plan != '':
            where_clauses.append('rc."planTurno" = :plan')
            qParams['plan'] = plan
        
        if sucursal != '':
            where_clauses.append('rc."sucursal" = :sucursal')
            qParams['sucursal'] = sucursal

        if radio != '':
            where_clauses.append('rc."radio" = :radio')
            qParams['radio'] = radio

        # Verifica si se proporcionan ambos parámetros de fecha para usar BETWEEN
        if fechaDesde != '' and fechaHasta != '':
            where_clauses.append('rc."fecha" BETWEEN :fechaDesde AND :fechaHasta')
            qParams['fechaDesde'] = fechaDesde
            qParams['fechaHasta'] = fechaHasta
        elif fechaDesde != '':
            # Si solo se proporciona fechaDesde, busca desde esa fecha en adelante
            where_clauses.append('rc."fecha" >= :fechaDesde')
            qParams['fechaDesde'] = fechaDesde
        elif fechaHasta != '':
            # Si solo se proporciona fechaHasta, busca hasta esa fecha
            where_clauses.append('rc."fecha" <= :fechaHasta')
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
            # Solo traigo estas columnas porque las demás no las necesito
            datosPiezasPostales.append({
                'grupoCliente': row.grupoCliente,
                'nroCliente': row.nroCliente,
                'titular': row.titular,
                'plan': row.planTurno,
                'sucursal': row.sucursal,
                'radio': row.radio,
                'estadoPieza': row.estadoPieza,
                'geoVisita': row.geoVisita,
                'foto': row.foto,
                'fecha': row.fecha
            })

        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 404
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200
    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500

@radioCliente.route('/api/geoMapaItems', methods=['GET'])
def mapaItems():
    plan = request.args.get('plan')
    sucursal = request.args.get('sucursal')
    radio = request.args.get('radio')
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
                'planTurno': row.planTurno,
                'radio': row.radio,
                'sucursal': row.sucursal,
                'latitud': row.latitud,
                'longitud': row.longitud,
                'fecha': row.fechaDistrib
            })

        print(datosPiezasPostales)

        if not datosPiezasPostales:
            return '{"message": "Recursos no encontrados"}', 204
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200
    except Exception as e:
        print()
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
    
@radioCliente.route('/api/geoMapaCamino', methods=['GET'])
def mapaCamino():
    plan = request.args.get('plan')
    sucursal = request.args.get('sucursal')
    radio = request.args.get('radio')
    fechaDesde = request.args.get('fechaDesde')
    fechaHasta = request.args.get('fechaHasta')
    grupoCliente = request.args.get('grupoCliente')

    try:        
        queryBase = 'SELECT * FROM "geoItemEmision" gie'

        where_clauses = []
        qParams = {}

        if grupoCliente != 'null':
            where_clauses.append('gie."idGrupoCliente" = :grupoCliente')
            qParams['grupoCliente'] = grupoCliente

        if plan != '':
            where_clauses.append('gie."planTurno" = :plan')
            qParams['plan'] = plan
        
        if sucursal != '':
            where_clauses.append('gie."sucursal" = :sucursal')
            qParams['sucursal'] = sucursal

        if radio != '':
            where_clauses.append('gie."radio" = :radio')
            qParams['radio'] = radio

        # Verifica si se proporcionan ambos parámetros de fecha para usar BETWEEN
        if fechaDesde != '' and fechaHasta != '':
            where_clauses.append('gie."fecha" BETWEEN :fechaDesde AND :fechaHasta')
            qParams['fechaDesde'] = fechaDesde
            qParams['fechaHasta'] = fechaHasta
        elif fechaDesde != '':
            # Si solo se proporciona fechaDesde, busca desde esa fecha en adelante
            where_clauses.append('gie."fecha" >= :fechaDesde')
            qParams['fechaDesde'] = fechaDesde
        elif fechaHasta != '':
            # Si solo se proporciona fechaHasta, busca hasta esa fecha
            where_clauses.append('gie."fecha" <= :fechaHasta')
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

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataDropDwnPlan": datosPiezasPostales}), 200
    except Exception as e:
        print()
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500

#jsonify lo que hace es convierte lo que trae de la base de datos a json
@radioCliente.route('/api/plan', methods=['GET'])
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
@radioCliente.route('/api/sucursal', methods=['GET'])
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
@radioCliente.route('/api/radio', methods=['GET'])
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




