import hashlib
from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def get_current_grupo_cliente():
    """
    idGrupoCliente del usuario logueado, tomado del JWT (no del request),
    para que un usuario no pueda pedir datos de otro grupoCliente
    simplemente cambiando el query param en la URL.
    Devuelve un str para no romper el codigo existente, que siempre
    trabajo con lo que devolvia request.args.get(...).
    """
    idGrupoCliente = get_jwt().get('idGrupoCliente')
    return str(idGrupoCliente) if idGrupoCliente is not None else None


def get_sha256_hash(input_string: str) -> str:
    sha256 = hashlib.sha256()
    sha256.update(input_string.encode('utf-8'))
    return sha256.hexdigest()


def admin_required(fn):
    """
    Igual que jwt_required(), pero ademas exige que el claim 'esAdmin'
    del JWT sea verdadero. El flag viaja en el token (seteado en el
    login), no se vuelve a consultar la DB en cada request.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        if not get_jwt().get('esAdmin'):
            return jsonify({"message": "Acceso restringido a administradores"}), 403
        return fn(*args, **kwargs)
    return wrapper
