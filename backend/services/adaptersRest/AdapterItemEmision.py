from models.emision.ItemEmision import ItemEmision

class AdapterItemEmision:
    def convertQueryToJson(objQuery):
        itemEmisionJSON = {
            "id": objQuery.id,
            "nro_cliente": objQuery.nro_cliente,
            "titular": objQuery.titular,
            "calle": objQuery.calle,
            "altura": objQuery.altura,
            "id_emision": objQuery.id_emision,
            "sucursal": objQuery.sucursal,
            "plan_turno": objQuery.plan_turno,
            "radio": objQuery.radio,
            "ruta": objQuery.ruta,
            "distribuidor": objQuery.distribuidor,
            "estado_pieza": objQuery.estado_pieza,
            "obs_interna": objQuery.obs_interna,
            "obs_visita": objQuery.obs_visita,
            "fecha_distribucion": objQuery.fecha_distribucion,
            "hora_distribucion": objQuery.hora_distribucion,
            "geo_cliente": objQuery.geo_cliente,
            "geo_visita": objQuery.geo_visita,
            "foto": objQuery.foto
            }
        return itemEmisionJSON
    
    def convertJsonToObj(data_dict):
        itemEmision = ItemEmision()
        
        itemEmision.id = data_dict.get('id')
        itemEmision.nro_cliente = data_dict.get('nro_cliente')
        itemEmision.calle = data_dict.get('calle')
        itemEmision.altura = data_dict.get('altura')
        itemEmision.id_emision = data_dict.get('id_emision')
        itemEmision.sucursal = data_dict.get('sucursal')
        itemEmision.plan_turno = data_dict.get('plan_turno')
        itemEmision.radio = data_dict.get('radio')
        itemEmision.ruta = data_dict.get('ruta')
        itemEmision.distribuidor = data_dict.get('distribuidor')
        itemEmision.estado_pieza = data_dict.get('estado_pieza')
        itemEmision.obs_interna = data_dict.get('obs_interna')
        itemEmision.obs_visita = data_dict.get('obs_visita')
        itemEmision.fecha_distribucion = data_dict.get('fecha_distribucion')
        itemEmision.hora_distribucion = data_dict.get('hora_distribucion')
        itemEmision.geo_cliente = data_dict.get('geo_cliente')
        itemEmision.geo_visita = data_dict.get('geo_visita')
        itemEmision.foto = data_dict.get('foto')

        return itemEmision