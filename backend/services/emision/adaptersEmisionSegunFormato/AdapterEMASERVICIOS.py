from sqlalchemy import func, cast, Text, text
from models.emision.ItemEmision import ItemEmision
from db.QueryObj import QueryObj
from db.masterRepo import DatabaseSession
from flask import Blueprint, jsonify, request, current_app, json
from datetime import datetime

class AdapterEMASERVICIOS:
    def leerItemEmision(entry, idEmision):
        print("WASAAAAAAAAAAAAAA", entry['Cliente'])

        if entry['Cliente'] != '-':
            itemEmision = ItemEmision(
                nroCliente = str(entry['N° Cliente']),
                titular = entry['Titular'], 
                calle = str(entry['Calle']),
                idEmision = idEmision,
                sucursal = str(entry['Sucursal']),
                planTurno = str(entry['Plan-Turno']),
                radio = str(entry['Radio']),
                ruta = str(entry['Ruta']),
                distribuidor =  str(entry['Nombre']),
                estadoPieza =  str(entry['Estado']),
                obsInterna = str(entry['Obs. Interna']),
                obsVisita = str(entry['Obs. de Visita']),
                fechaDistrib = convertir_fecha(entry['Fecha Distribucion']),
                horaDistrib = chequeadorHora(entry['Hora Distribucion']) ,
                geoCliente = entry['Geo de Cliente'],
                geoVisita = entry['Geo de Visita'],
                foto = entry['Foto'],
                idGrupoCliente = obtenerIdGrupoCliente(entry['Cliente']), 
                lote = str(entry['Lote']),
                legajo = str(entry['Legajo']),
                tipoDePieza =  str(entry['Tipo de Pieza']),
                localidad =  str(entry['Localidad']),
                firma = entry['Firma'],
                altura =  str(entry['Altura']),
            )
        else:
            itemEmision = None

        return itemEmision
    
def chequeadorHora(hora):
    if hora != '-':
        return hora
    else:
        return None

def obtenerIdGrupoCliente(nombreGrupoCliente):
    if nombreGrupoCliente.find("EDESUR") != -1:
        nombreGrupoCliente = "EDESUR"
    elif nombreGrupoCliente.find("AYSA") != -1:
        nombreGrupoCliente = "AYSA S.A."
    
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
    if fecha_str == '-':
        return None

    try:
        # Convertir la fecha del formato 'dd/mm/yyyy' a un objeto datetime
        print(fecha_str)

        fecha_obj = datetime.strptime(fecha_str, '%d/%m/%Y')

        
        # Convertir el objeto datetime al formato 'yyyy-mm-dd'
        return fecha_obj.strftime('%Y-%m-%d')
    except ValueError:
        # Manejo de errores si el formato de entrada es incorrecto
        raise ValueError("El formato de la fecha debe ser 'dd/mm/yyyy'.")