import json
from flask import Blueprint, jsonify, request, json, current_app
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_access_cookies,
    unset_jwt_cookies,
)
from sqlalchemy import text, cast, Text
from db.masterRepo import DatabaseSession
from models.usuario.Usuario import Usuario
from models.usuario.Credencial import Credencial
from utils.auth_helpers import get_sha256_hash

auth = Blueprint('auth', __name__)

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
                current_app.logger.error(f"Error converting data types: {e}")
                continue

        if dataQueryJson and dataQueryJson[0]['found']:
            usuario = dataQueryJson[0]

            # get_credenciales() no devuelve el id de usuario ni si es admin,
            # asi que lo buscamos aparte por el nombre de usuario ya validado.
            with DatabaseSession().get_session() as session:
                credencial = session.query(Credencial).filter(
                    Credencial.nomUsuario == usuario['userName']
                ).first()
                usuario_db = (
                    session.query(Usuario).filter(Usuario.idCredencial == credencial.id).first()
                    if credencial else None
                )

            id_usuario = usuario_db.id if usuario_db else None
            es_admin = bool(usuario_db.esAdmin) if usuario_db else False

            usuario['idUsuario'] = id_usuario
            usuario['esAdmin'] = es_admin

            additional_claims = {
                'nombre': usuario['nombre'],
                'apellido': usuario['apellido'],
                'idGrupoCliente': usuario['idGrupoCliente'],
                'idUsuario': id_usuario,
                'esAdmin': es_admin,
            }
            access_token = create_access_token(
                identity=usuario['userName'],
                additional_claims=additional_claims,
            )

            response = jsonify({"data": dataQueryJson})
            set_access_cookies(response, access_token)
            return response, 200
        else:
            return jsonify({"message": "Bad username or password"}), 401

    except Exception as e:
        current_app.logger.error(f"Error en /api/login: {e}")
        return jsonify({"message": "Error al iniciar sesion"}), 500

@auth.route('/api/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Sesion cerrada"})
    unset_jwt_cookies(response)
    return response, 200

@auth.route('/api/me', methods=['GET'])
@jwt_required()
def me():
    claims = get_jwt()
    return jsonify({
        "userName": get_jwt_identity(),
        "nombre": claims.get('nombre'),
        "apellido": claims.get('apellido'),
        "idGrupoCliente": claims.get('idGrupoCliente'),
        "idUsuario": claims.get('idUsuario'),
        "esAdmin": claims.get('esAdmin', False),
    }), 200

@auth.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200