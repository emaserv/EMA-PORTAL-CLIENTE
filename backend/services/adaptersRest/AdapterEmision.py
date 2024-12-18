from models.emision.Emision import Emision

class AdapterEmision:
    def convertQueryToJson(objQuery):
        emisionJson = {
            "id": objQuery.id,
            "nombre": objQuery.nombre
            }
        return emisionJson
    
    def convertJsonToObj(data_dict):
        emision = Emision()
        
        emision.id = data_dict.get('id')
        emision.nombre = data_dict.get('nombre')

        return emision