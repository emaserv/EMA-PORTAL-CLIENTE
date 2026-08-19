import json
from flask import Blueprint, jsonify, request, json
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import text, cast, Text
from db.masterRepo import DatabaseSession
import hashlib

auth = Blueprint('auth', __name__)

def get_column_names(model):
    return [column.name for column in model._table_.columns]

def get_sha256_hash(input_string: str) -> str:
    # Crea un objeto hash SHA-256
    sha256 = hashlib.sha256()
    # Actualiza el objeto hash con el string codificado en bytes
    sha256.update(input_string.encode('utf-8'))
    # Devuelve el hash en formato hexadecimal
    return sha256.hexdigest()

@auth.route('/api/login', methods=['POST'])
def login():
    try:
        # Ensure data is sent in the request
        if not request.form.get('data'):
           return jsonify({"message": "No data provided"}), 400
        
        json_data = request.form.get('data')
        data_dict = json.loads(json_data)
        user_name = data_dict.get("userName")
        pswrd = data_dict.get("password")

        password = get_sha256_hash(pswrd)
        
        with DatabaseSession().get_session() as session:
            query = text('SELECT * FROM get_credenciales(:userName, :password)')
            data_query = session.execute(query, {'userName': user_name, 'password': password})

        dataQueryJson = []
        for row in data_query:
            try:
                # Convertir explícitamente los tipos
                dataQueryJson.append({
                    'userName': str(row[0]) if row[0] else None,
                    'nombre': str(row[1]) if row[1] else None,
                    'apellido': str(row[2]) if row[2] else None,
                    'idGrupoCliente': int(row[3]) if row[3] else None,
                    'found': bool(row[4])
                })
            except (ValueError, TypeError) as e:
                app.logger.error(f"Error converting data types: {e}")
                continue

        if dataQueryJson and dataQueryJson[0]['found']:
            return jsonify({"data": dataQueryJson}), 200
        else:
            return jsonify({"message": "Bad username or password"}), 401

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta de mierda!: {str(e)}"}), 401
    
@auth.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200