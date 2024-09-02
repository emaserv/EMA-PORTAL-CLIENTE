from sqlalchemy import func, cast, Text, text
from models.emision.ItemEmision import ItemEmision
from db.QueryObj import QueryObj

class AdapterPSM:
    def leerItemEmision(entry, idEmision):
        itemEmision = ItemEmision(
            idEmision = idEmision,
            foto = entry['Foto'],
            cliente = entry['Cliente'],
            numeroDeCuenta = entry['Número de Cuenta'],
            nombreDelTitular = entry['Nombre del Titular'],
            direccion = entry['Dirección'],
            localidad = entry['Localidad'],
            plan = entry['plan'],
            sucursal = entry['sucursal'],
            radio = entry['radio'],
            lote = entry['Lote'],
            recorridoHistorico = entry['Recorrido H'],
            ruta = entry['Ruta'],
            estado = entry['Estado'],
            legajo = entry['Legajo'],
            nombre = entry['Nombre'],
            supervisor = entry['Supervisor'],
            fecha = entry['Fecha'],
            hora = entry['Hora'],
            observacion = entry['Observación'],
            firma = entry['Firma'],
        )

        return itemEmision