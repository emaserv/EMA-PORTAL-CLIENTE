import json
from flask import Blueprint, jsonify, request, json
from sqlalchemy import text, cast, Text
from db.masterRepo import DatabaseSession
import hashlib

auth = Blueprint('auth', __name__)

def get_column_names(model):
    return [column.name for column in model.__table__.columns]

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
        
        return jsonify({"message": "Conexión y consulta exitosas"})
    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500