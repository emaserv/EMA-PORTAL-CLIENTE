import json
from flask import Blueprint, jsonify, request, json
from sqlalchemy import text, cast, Text
from db.masterRepo import DatabaseSession
from models.geoJson.GeoJson import GeoJson
geoJson = Blueprint('geoJson', __name__)

@geoJson.route('/api/geoJson/consultarGeoJson', methods=['POST'])
def getGeoJson():
    print("entro")
    
    plan = request.form.get('plan')
    sucursal = request.form.get('sucursal')
    radio = request.form.get('radio')
    
    try:
        if not all([plan, sucursal, radio]):
            return jsonify({"message": "Faltan parametros 'plan', 'sucursal', o 'radio'"}), 400
        
        nombre_buscar = f"{plan}-{sucursal}-{radio}"
        
        with DatabaseSession().get_session() as session:
            geojson = session.query(GeoJson).filter(GeoJson.nombre == nombre_buscar).first()
            if geojson is None:
                return jsonify({'error': 'GeoJson not found'}), 404
            
            # Convierte los datos binarios de 'geoData' a una cadena JSON
            geojson_data = geojson.geoData.decode('utf-8')

        return jsonify({"message": "Conexión y consulta exitosas", "geoData": json.loads(geojson_data)})


    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
    
