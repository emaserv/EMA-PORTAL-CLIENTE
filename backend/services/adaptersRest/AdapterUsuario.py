from models.usuario.Usuario import Usuario

class AdapterUsuario:
    def convertQueryToJson(objQuery):
        userJson = {
            "id": objQuery.id,
            "nombre": objQuery.nombre,
            "apellido": objQuery.apellido, 
            "id_grupo_cliente": objQuery.id_grupo_cliente,
            "id_credencial": objQuery.id_credencial
            }
        return userJson
    
    def convertJsonToObj(data_dict):
        user = Usuario()

        user.id = data_dict.get('id')
        user.nombre = data_dict.get('nombre')
        user.apellido = data_dict.get('apellido')
        user.id_grupo_cliente = data_dict.get('id_grupo_cliente')
        user.id_credencial = data_dict.get('id_credencial')

        return user