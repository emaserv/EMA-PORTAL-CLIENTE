from models.emision.Emision import Emision

class AdapterEmision:
    def convertQueryToJson(objQuery):
        emisionJson = {
            "id": objQuery.id,
            "nombre": objQuery.nombre,
            "id_grupo_cliente": objQuery.id_grupo_cliente
            }
        return emisionJson
    
    def convertJsonToObj(data_dict):
        emision = Emision()
        
        emision.id = data_dict.get('id')
        emision.nombre = data_dict.get('nombre')
        emision.id_grupo_cliente = data_dict.get('id_grupo_cliente')

        return emision