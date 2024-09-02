from sqlalchemy import func, cast, Text, text
from models.emision.ItemEmision import ItemEmision
from db.QueryObj import QueryObj

class AdapterEMASERVICIOS:
    def leerItemEmision(entry, idEmision):
        itemEmision = ItemEmision(
            idEmision = idEmision,
            nro_cliente = entry['N° Cliente'],
            titular = entry['Titular'],
            calle = entry[''],
            altura = entry[],
            sucursal = entry[],
            planTurno = entry[],
            radio = entry[],
            ruta = entry[],
            distribuidor = entry[],
            estadoPieza = entry[],
            obsInterna = entry[],
            obsVisita = entry[],
            fechaDistrib = entry[],
            horaDistrib = entry[],
            geoCliente = entry[],
            geoVisita = entry[],
            foto = entry[],
            idGrupoCliente = entry[],
        )

        return itemEmision