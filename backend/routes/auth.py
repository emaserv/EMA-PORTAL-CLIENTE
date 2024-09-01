import json
from flask import Blueprint, jsonify, request, json
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
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

        print(user_name)
        print(password)

        with DatabaseSession().get_session() as session:
            query = text('SELECT * FROM get_credenciales(:userName, :password)')
            data_query = session.execute(query, {'userName': user_name, 'password': password})

        dataQueryJson = []
        for row in data_query:
            dataQueryJson.append({
                'userName': row.userN,
                'psswrd': row.contra,
                'found': row.found
            })

        print(dataQueryJson)
        '''
        if dataQueryJson[0]['found']:
            access_token = create_access_token(identity=dataQueryJson[0]['userName'])
            return jsonify(access_token=access_token)
        else:
            return jsonify({"message": "Bad username or password"}), 401
        '''
        return jsonify({"message": f"Consulta ejecutada correctamente"}), 200
    
    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
    
@auth.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200