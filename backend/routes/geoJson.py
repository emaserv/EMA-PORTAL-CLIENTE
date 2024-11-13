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

        if not all([plan, sucursal, radio]):
            return jsonify({"message": "Faltan parametros 'plan', 'sucursal', o 'radio'"}), 400

        nombre_buscar = f"{sucursal}-{plan}-{radio}"

        with DatabaseSession().get_session() as session:
            geojson = session.query(GeoJson).filter(GeoJson.nombre == nombre_buscar).first()
            if geojson is None:
                return jsonify({'error': 'GeoJson not found'}), 404

            geojson_data = geojson.geoData.decode('utf-8')

        return jsonify({"message": "Conexión y consulta exitosas", "geoData": json.loads(geojson_data)})

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
