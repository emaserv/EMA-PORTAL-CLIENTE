from sqlalchemy import func, cast, Text, text
from models.emision.ItemEmision import ItemEmision
from db.QueryObj import QueryObj
from db.masterRepo import DatabaseSession
from flask import Blueprint, jsonify, request, current_app, json
from datetime import datetime

class AdapterEMASERVICIOS:
    def leerItemEmision(entry, idEmision):

        if entry['Cliente'] != '-':
            itemEmision = ItemEmision(
                idEmision = idEmision,
                nroCliente = str(entry['N° Cliente']) if entry['N° Cliente'] != None else None,
                titular = entry['Titular'], 
                calle = str(entry['Calle']) if entry['Calle'] != None else None,
                altura =  str(entry['Altura']) if entry['Altura'] != None else None,
                localidad =  str(entry['Localidad']) if entry['Localidad'] != None else None,
                planTurno = str(entry['Plan-Turno']) if entry['Plan-Turno'] != None else None,
                sucursal = str(entry['Sucursal']) if entry['Sucursal'] != None else None,
                radio = str(entry['Radio']) if entry['Radio'] != None else None,
                lote = str(entry['Lote']) if entry['Lote'] != None else None,
                ruta = str(entry['Ruta']) if entry['Ruta'] != None else None,
                estadoPieza =  str(entry['Estado']) if entry['Estado'] != None else None,
                legajo = str(entry['Legajo']) if entry['Legajo'] != None else None,
                distribuidor =  str(entry['Nombre']) if entry['Nombre'] != None else None,
                fechaDistrib = convertir_fecha(entry['Fecha Distribucion']),
                horaDistrib = chequeadorHora(entry['Hora Distribucion']),
                obsInterna = str(entry['Obs. Interna']) if entry['Obs. Interna'] != None else None,
                obsVisita = str(entry['Obs. de Visita']) if entry['Obs. de Visita'] != None else None,
                foto = entry['Foto'] if entry['Foto'] != None else None,
                firma = entry['Firma'] if entry['Firma'] != None else None,
                geoVisita = entry['Geo de Visita'] if entry['Geo de Cliente'] != None else None,
                fechaEmision = convertir_fecha(entry['Emision']),
                tipoDePieza =  str(entry['Tipo de Pieza']) if entry['Tipo de Pieza'] != None else None,
                geoCliente = entry['Geo de Cliente'] if entry['Geo de Cliente'] != None else None,
                idGrupoCliente = obtenerIdGrupoCliente(entry['Cliente']), 
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
        # dd/mm/yyyy
        fecha_obj = datetime.strptime(str(fecha_str), '%d/%m/%Y')
        return fecha_obj.strftime('%Y-%m-%d')
    except ValueError:
        try:
            # yymmdd
            fecha_nueva = '20' + str(fecha_str)
            fecha_obj = datetime.strptime(fecha_nueva, '%Y%m%d')
            return fecha_obj.strftime('%Y-%m-%d')
        except ValueError:
            try:
                # yyyy-mm-ddThh:mm:ss.sss
                fecha_obj = datetime.strptime(str(fecha_str), "%Y-%m-%dT%H:%M:%S.%f")
                return fecha_obj.strftime('%Y-%m-%d')
            except ValueError:
                try:
                    # yyyy-mm-dd hh:mm:ss  ← ESTA es la que necesitás agregar
                    fecha_obj = datetime.strptime(str(fecha_str), "%Y-%m-%d %H:%M:%S")
                    return fecha_obj.strftime('%Y-%m-%d')
                except ValueError:
                    raise ValueError("El formato de la fecha debe ser 'dd/mm/yyyy', 'yymmdd', o 'yyyy-mm-dd hh:mm:ss'.")