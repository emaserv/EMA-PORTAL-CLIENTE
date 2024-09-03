from models.usuario.Usuario import Usuario

class AdapterUsuario:
    def convertQueryToJson(objQuery):
        userJson = {
            "id": objQuery.id,
            "nombre": objQuery.nombre,
            "apellido": objQuery.apellido, 
            "idGrupoCliente": objQuery.idGrupoCliente,
            "idCredencial": objQuery.idCredencial
            }
        return userJson
    
    def convertJsonToObj(data_dict):
        user = Usuario()

        user.id = data_dict.get('id')
        user.nombre = data_dict.get('nombre')
        user.apellido = data_dict.get('apellido')
        user.idGrupoCliente = data_dict.get('idGrupoCliente')
        user.idCredencial = data_dict.get('idCredencial')

        return user