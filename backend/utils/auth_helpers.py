from flask_jwt_extended import get_jwt


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
