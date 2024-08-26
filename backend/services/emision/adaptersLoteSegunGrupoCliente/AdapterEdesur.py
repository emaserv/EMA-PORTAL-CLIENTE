from sqlalchemy import func, cast, Text, text
from models.lote.ItemLote import ItemLote
from db.QueryObj import QueryObj

class AdapterEdesur:
    def leerItemLote(entry, idLote, idClienteBtoCNew):
        itemLote = ItemLote(
            idLote = idLote, 
            codigoBarras = str(entry['Código de Barras']),
            camposExtra=func.jsonb_build_object(
            'Plan', cast(entry['Plan'], Text),  
            'Radio', cast(entry['Radio'], Text),
            'Sucursal', cast(entry['Sucursal'], Text),
            ),
            idClienteBtoC = idClienteBtoCNew
        )

        return itemLote

    #funcion auxiliar para poder mandar booleanos a postgres

    # Desarma el json y arma la query a ejecutar
    def obtenerQueryParaAsignarRecorridoAItemLote(data_dict):
        idLote = data_dict.get('idLote')
        planAAsignar = data_dict.get('plan')
        sucursalAASignar =  data_dict.get('sucursal')
        radioAAsignar = data_dict.get('radio')
        numRecHist = data_dict.get('recorrido')
        ordenNum = data_dict.get('orden')
        sinHistorico = data_dict.get('checkbox')

        qText = text('CALL asignar_ruta_a_item_lotes_edesur(:idLot, :plan, :sucursal, :radio, :recorrido, :orden, :flagNotHist)')
        
        qParams ={
            'idLot': idLote,
            'plan': planAAsignar,
            'sucursal': sucursalAASignar,
            'radio': radioAAsignar,
            'recorrido': numRecHist,
            'orden': ordenNum,
            'flagNotHist': sinHistorico
        }
        
        return QueryObj(queryParams=qParams, queryText=qText)

    
    def obtenerQueryParaTablaMasterGeneral():
        return text('SELECT * FROM view_cant_piezas_por_tipoServicio_para_edesur')
    
    def armarJsonTablaMaster(dataQuery):

        allJson = []

        for row in dataQuery:
            allJson.append({
                'id': row.id,
                'idLote': row.idLote,
                'plan': row.plan,
                'sucursal': row.sucursal,
                'radio': row.radio,
                'cantidadDePiezas': row.count
            })

        return allJson