from models.cliente.GrupoCliente import GrupoCliente

class AdapterGrupoCliente:
    def convertQueryToJson(objQuery):
        GrupoClienteJson = {
            "id": objQuery.id,
            "nombre": objQuery.nombre
            }
        return GrupoClienteJson
    
    def convertJsonToObj(data_dict):
        GrupoCliente = GrupoCliente()
        
        GrupoCliente.id = data_dict.get('id')
        GrupoCliente.nombre = data_dict.get('nombre')

        return GrupoCliente