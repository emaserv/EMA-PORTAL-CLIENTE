from sqlalchemy import func, cast, Text, text
from models.emision.ItemEmision import ItemEmision
from db.QueryObj import QueryObj
from db.masterRepo import DatabaseSession
from flask import Blueprint, jsonify, request, current_app, json
from datetime import datetime

class AdapterEMASERVICIOS:
    def leerItemEmision(entry, idEmision):
        itemEmision = ItemEmision(
            nroCliente = entry['N° Cliente'],
            titular = entry['Titular'], 
            calle = entry['Calle'],
            idEmision = idEmision,
            sucursal = entry['Sucursal'],
            planTurno = entry['Plan-Turno'],
            radio = entry['Radio'],
            ruta = entry['Ruta'],
            distribuidor = entry['Nombre'],
            estadoPieza = entry['Estado'],
            obsInterna = entry['Obs. Interna'],
            obsVisita = entry['Obs. de Visita'],
            fechaDistrib = convertir_fecha(entry['Fecha Distribucion']),
            horaDistrib = entry['Hora Distribucion'],
            geoCliente = entry['Geo de Cliente'],
            geoVisita = entry['Geo de Visita'],
            foto = entry['Foto'],
            idGrupoCliente = obtenerIdGrupoCliente(entry['Cliente']), 
            lote = entry['Lote'],
            legajo = entry['Legajo'],
            tipoDePieza = entry['Tipo de Pieza'],
            localidad = entry['Localidad'],
            firma = entry['Firma'],
            altura = entry['Altura'],
        )

        return itemEmision

def obtenerIdGrupoCliente(nombreGrupoCliente):
    try:        
        query = text('SELECT id FROM "grupoCliente" WHERE nombre = :nombreGrupoCliente')
        queryParams = {'nombreGrupoCliente': nombreGrupoCliente}

        with DatabaseSession().get_session() as session:
            data_query = session.execute(query, queryParams)
                
        
        # Obtener el primer resultado si existe
        row = data_query.fetchone()

        if row is None:
            return None  # No se encontró el grupo de cliente

        # Retornar el ID encontrado
        return row.id

    except Exception as e:
        print(f"Error al ejecutar la consulta: {str(e)}")
        return None
    
def convertir_fecha(fecha_str):
    """
    Convierte una fecha del formato 'dd/mm/yyyy' al formato 'yyyy-mm-dd'.
    
    :param fecha_str: str, fecha en formato 'dd/mm/yyyy'
    :return: str, fecha en formato 'yyyy-mm-dd'
    """
    try:
        # Convertir la fecha del formato 'dd/mm/yyyy' a un objeto datetime
        fecha_obj = datetime.strptime(fecha_str, '%d/%m/%Y')
        # Convertir el objeto datetime al formato 'yyyy-mm-dd'
        return fecha_obj.strftime('%Y-%m-%d')
    except ValueError:
        # Manejo de errores si el formato de entrada es incorrecto
        raise ValueError("El formato de la fecha debe ser 'dd/mm/yyyy'.")