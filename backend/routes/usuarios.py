from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import get_jwt

from db.masterRepo import DatabaseSession
from models.usuario.Usuario import Usuario
from models.usuario.Credencial import Credencial
from models.cliente.GrupoCliente import GrupoCliente
from utils.auth_helpers import admin_required, get_sha256_hash

usuarios = Blueprint('usuarios', __name__)

PASSWORD_MIN_LENGTH = 4


def usuario_a_json(usuario, credencial, grupo):
    return {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "userName": credencial.nomUsuario if credencial else None,
        "idGrupoCliente": usuario.idGrupoCliente,
        "grupoCliente": grupo.nombre if grupo else None,
        "esAdmin": bool(usuario.esAdmin),
    }


@usuarios.route('/api/admin/usuarios', methods=['GET'])
@admin_required
def listar_usuarios():
    try:
        with DatabaseSession().get_session() as session:
            filas = (
                session.query(Usuario, Credencial, GrupoCliente)
                .outerjoin(Credencial, Usuario.idCredencial == Credencial.id)
                .outerjoin(GrupoCliente, Usuario.idGrupoCliente == GrupoCliente.id)
                .order_by(Usuario.id)
                .all()
            )
        data = [usuario_a_json(u, c, g) for u, c, g in filas]
        return jsonify({"message": "Usuarios encontrados", "usuarios": data}), 200
    except Exception as e:
        current_app.logger.error(f"Error al listar usuarios: {e}")
        return jsonify({"message": "Error al obtener los usuarios"}), 500


@usuarios.route('/api/admin/grupos-cliente', methods=['GET'])
@admin_required
def listar_grupos_cliente():
    try:
        with DatabaseSession().get_session() as session:
            grupos = session.query(GrupoCliente).order_by(GrupoCliente.nombre).all()
        return jsonify({
            "gruposCliente": [{"id": g.id, "nombre": g.nombre} for g in grupos]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error al listar grupos de cliente: {e}")
        return jsonify({"message": "Error al obtener los grupos de cliente"}), 500


@usuarios.route('/api/admin/usuarios', methods=['POST'])
@admin_required
def crear_usuario():
    data = request.json or {}
    user_name = (data.get('userName') or '').strip()
    password = data.get('password') or ''
    nombre = (data.get('nombre') or '').strip()
    apellido = (data.get('apellido') or '').strip()
    id_grupo_cliente = data.get('idGrupoCliente')
    es_admin = bool(data.get('esAdmin', False))

    if not user_name or not password or not nombre or not id_grupo_cliente:
        return jsonify({
            "message": "Faltan campos obligatorios (usuario, contraseña, nombre, grupo de cliente)"
        }), 400

    if len(password) < PASSWORD_MIN_LENGTH:
        return jsonify({
            "message": f"La contraseña debe tener al menos {PASSWORD_MIN_LENGTH} caracteres"
        }), 400

    try:
        with DatabaseSession().get_session() as session:
            existente = session.query(Credencial).filter(Credencial.nomUsuario == user_name).first()
            if existente:
                return jsonify({"message": "Ya existe un usuario con ese nombre de usuario"}), 409

            credencial = Credencial(nomUsuario=user_name, contrasenia=get_sha256_hash(password))
            session.add(credencial)
            session.flush()  # necesitamos credencial.id antes de crear el usuario

            usuario = Usuario(
                nombre=nombre,
                apellido=apellido,
                idGrupoCliente=id_grupo_cliente,
                idCredencial=credencial.id,
                esAdmin=es_admin,
            )
            session.add(usuario)
            session.commit()
            nuevo_id = usuario.id

        return jsonify({"message": "Usuario creado con éxito", "id": nuevo_id}), 201
    except Exception as e:
        current_app.logger.error(f"Error al crear usuario: {e}")
        return jsonify({"message": "Error al crear el usuario"}), 500


@usuarios.route('/api/admin/usuarios/<int:id>', methods=['PUT'])
@admin_required
def actualizar_usuario(id):
    data = request.json or {}
    claims = get_jwt()

    try:
        with DatabaseSession().get_session() as session:
            usuario = session.query(Usuario).get(id)
            if usuario is None:
                return jsonify({"message": "Usuario no encontrado"}), 404

            if 'nombre' in data:
                usuario.nombre = (data.get('nombre') or '').strip()
            if 'apellido' in data:
                usuario.apellido = (data.get('apellido') or '').strip()
            if 'idGrupoCliente' in data and data.get('idGrupoCliente'):
                usuario.idGrupoCliente = data.get('idGrupoCliente')

            if 'esAdmin' in data:
                nuevo_es_admin = bool(data.get('esAdmin'))
                if usuario.id == claims.get('idUsuario') and not nuevo_es_admin:
                    return jsonify({
                        "message": "No podés quitarte a vos mismo el rol de administrador"
                    }), 400
                usuario.esAdmin = nuevo_es_admin

            user_name = (data.get('userName') or '').strip()
            password = data.get('password') or ''

            if user_name or password:
                credencial = session.query(Credencial).get(usuario.idCredencial)
                if credencial is None:
                    return jsonify({"message": "El usuario no tiene credenciales asociadas"}), 400

                if user_name and user_name != credencial.nomUsuario:
                    duplicado = (
                        session.query(Credencial)
                        .filter(Credencial.nomUsuario == user_name, Credencial.id != credencial.id)
                        .first()
                    )
                    if duplicado:
                        return jsonify({"message": "Ya existe un usuario con ese nombre de usuario"}), 409
                    credencial.nomUsuario = user_name

                if password:
                    if len(password) < PASSWORD_MIN_LENGTH:
                        return jsonify({
                            "message": f"La contraseña debe tener al menos {PASSWORD_MIN_LENGTH} caracteres"
                        }), 400
                    credencial.contrasenia = get_sha256_hash(password)

            session.commit()

        return jsonify({"message": "Usuario actualizado con éxito"}), 200
    except Exception as e:
        current_app.logger.error(f"Error al actualizar usuario {id}: {e}")
        return jsonify({"message": "Error al actualizar el usuario"}), 500


@usuarios.route('/api/admin/usuarios/<int:id>', methods=['DELETE'])
@admin_required
def eliminar_usuario(id):
    claims = get_jwt()
    if id == claims.get('idUsuario'):
        return jsonify({"message": "No podés eliminar tu propio usuario"}), 400

    try:
        with DatabaseSession().get_session() as session:
            usuario = session.query(Usuario).get(id)
            if usuario is None:
                return jsonify({"message": "Usuario no encontrado"}), 404

            id_credencial = usuario.idCredencial
            session.delete(usuario)
            session.flush()

            if id_credencial:
                credencial = session.query(Credencial).get(id_credencial)
                if credencial:
                    session.delete(credencial)

            session.commit()

        return jsonify({"message": "Usuario eliminado con éxito"}), 200
    except Exception as e:
        current_app.logger.error(f"Error al eliminar usuario {id}: {e}")
        return jsonify({"message": "Error al eliminar el usuario"}), 500
