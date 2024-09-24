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
                nroCliente = str(entry['N° Cliente']) if entry['N° Cliente'] != None else None,
                titular = entry['Titular'], 
                calle = str(entry['Calle']) if entry['Calle'] != None else None,
                idEmision = idEmision,
                sucursal = str(entry['Sucursal']) if entry['Sucursal'] != None else None,
                planTurno = str(entry['Plan-Turno']) if entry['Plan-Turno'] != None else None,
                radio = str(entry['Radio']) if entry['Radio'] != None else None,
                ruta = str(entry['Ruta']) if entry['Ruta'] != None else None,
                distribuidor =  str(entry['Nombre']) if entry['Nombre'] != None else None,
                estadoPieza =  str(entry['Estado']) if entry['Estado'] != None else None,
                obsInterna = str(entry['Obs. Interna']) if entry['Obs. Interna'] != None else None,
                obsVisita = str(entry['Obs. de Visita']) if entry['Obs. de Visita'] != None else None,
                fechaDistrib = convertir_fecha(entry['Fecha Distribucion']),
                horaDistrib = chequeadorHora(entry['Hora Distribucion']) ,
                geoCliente = entry['Geo de Cliente'] if entry['Geo de Cliente'] != None else None,
                geoVisita = entry['Geo de Visita'] if entry['Geo de Cliente'] != None else None,
                foto = entry['Foto'] if entry['Foto'] != None else None,
                idGrupoCliente = obtenerIdGrupoCliente(entry['Cliente']), 
                lote = str(entry['Lote']) if entry['Lote'] != None else None,
                legajo = str(entry['Legajo']) if entry['Legajo'] != None else None,
                tipoDePieza =  str(entry['Tipo de Pieza']) if entry['Tipo de Pieza'] != None else None,
                localidad =  str(entry['Localidad']) if entry['Localidad'] != None else None,
                firma = entry['Firma'] if entry['Firma'] != None else None,
                altura =  str(entry['Altura']) if entry['Altura'] != None else None,
                fechaEmision = convertir_fecha(entry['Emision']),
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

        fecha_obj = datetime.strptime(str(fecha_str), '%d/%m/%Y')

        # Convertir el objeto datetime al formato 'yyyy-mm-dd'
        return fecha_obj.strftime('%Y-%m-%d')
    except ValueError:
        try:
            # Convertir la fecha del formato 'yymmdd' a un objeto datetime
            fecha_nueva = '20' + str(fecha_str)

            fecha_obj = datetime.strptime(fecha_nueva, '%Y%m%d')

            return fecha_obj.strftime('%Y-%m-%d')
        except ValueError:
            # Manejo de errores si el formato de entrada es incorrecto
            raise ValueError("El formato de la fecha debe ser 'dd/mm/yyyy' o 'yymmdd'.")