import os
import pandas as pd
import json
from flask import Blueprint, jsonify, request, current_app, json
from sqlalchemy.sql import text
from db.masterRepo import DatabaseSession

fechaCliente = Blueprint('fechaCliente', __name__)

def get_column_names(model):
    return [column.name for column in model.__table__.columns]

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

        if grupoCliente != 'null':
            where_clauses.append('fc."idGrupoCliente" = :grupoCliente')
            qParams['grupoCliente'] = grupoCliente

        if numeroCliente != '':
            where_clauses.append('fc."nroCliente" = :numeroCliente')
            qParams['numeroCliente'] = numeroCliente

        # Verifica si se proporcionan ambos parámetros de fecha para usar BETWEEN
        if fechaDesde != '' and fechaHasta != '':
            where_clauses.append('fc."fecha" BETWEEN :fechaDesde AND :fechaHasta')
            qParams['fechaDesde'] = fechaDesde
            qParams['fechaHasta'] = fechaHasta
        elif fechaDesde != '':
            # Si solo se proporciona fechaDesde, busca desde esa fecha en adelante
            where_clauses.append('fc."fecha" >= :fechaDesde')
            qParams['fechaDesde'] = fechaDesde
        elif fechaHasta != '':
            # Si solo se proporciona fechaHasta, busca hasta esa fecha
            where_clauses.append('fc."fecha" <= :fechaHasta')
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

