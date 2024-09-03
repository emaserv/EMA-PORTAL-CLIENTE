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
@radioCliente.route('/api/radioCliente', methods=['GET'])
def tablaRC():
    
    try:        
        query = text('SELECT * FROM "radioCliente"')

        with DatabaseSession().get_session() as session:
            data_query = session.execute(query)
                
        datosPiezasPostales = []

        for row in data_query:
            datosPiezasPostales.append({
                'grupoCliente': row.grupoCliente,
                'nroCliente': row.nroCliente,
                'titular': row.titular,
                'plan': row.planTurno,
                'sucursal': row.sucursal,
                'radio': row.radio,
                'estadoPieza': row.estadoPieza,
                'geoVisita': row.geoVisita,
                'foto': row.foto
            })

        if not datosPiezasPostales:
            return '{"message": "Recursos no encontrados"}', 204
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200
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




