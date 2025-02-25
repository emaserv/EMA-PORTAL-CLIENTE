import re
from sqlalchemy import func, cast, Text, text
from models.dai.Dai import Dai
from db.QueryObj import QueryObj
from db.masterRepo import DatabaseSession
from flask import Blueprint, jsonify, request, current_app, json
from datetime import datetime


class AdapterDAI:
    def leerDAI(entry):
        print("WASAAAAAAAAAAAAAA", entry['legajo'])
        latitud_, longitud_ = procesar_geo(entry)   
        dai = Dai(
            #idGrupoCliente = obtenerIdGrupoCliente(entry['Grupo Cliente']), 
            legajoDist = str(entry['legajo']) if entry['legajo'] != None else None,
            fecha =  convertir_fecha(entry['date']),
            hora =  chequeadorHora(entry['time']),
            latitud= latitud_,
            longitud= longitud_,
            descEstado = str(entry['statusdesc']) if entry['statusdesc'] != None else None,
            pushpin = str(entry['pushpin']) if entry['pushpin'] != None else None,
            velocidad = str(entry['speedh']) if entry['speedh'] != None else None,
            altitud = str(entry['altitude']) if entry['altitude'] != None else None,
            odometro = str(entry['odometer']) if entry['odometer'] != None else None,
            distReportada = str(entry['reportdistance']) if entry['reportdistance'] != None else None,
            direccion = str(entry['address']) if entry['address'] != None else None,
            zonaGeo = str(entry['geozonedesc']) if entry['geozonedesc'] != None else None,
            mensConductor = str(entry['drivermessage']) if entry['drivermessage'] != None else None,
        )
    
        return dai
    
def procesar_geo(entry):
    if 'geopoint' in entry and entry['geopoint'] != '-':
        geo_str = entry['geopoint']
        
        # Dividir el valor en latitud y longitud
        try:
            latitud_str, longitud_str = geo_str.split('/')
            latitud = str(latitud_str)  
            longitud = str(longitud_str) 
        except ValueError:
            print(f"Error al dividir o convertir el valor de geo: {geo_str}")
            latitud, longitud = None, None
    else:
        latitud, longitud = None, None
    
    return latitud, longitud
    
def chequeadorHora(hora):
    print('hora', str(hora))

    if hora != '-':
        return hora
    else:
        return None

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
        print("aaa", row.id)
        return row.id

    except Exception as e:
        print(f"Error al ejecutar la consulta: {str(e)}")
        return None
    
def convertir_fecha(fecha_str):
    print('fecha_str', fecha_str)
    if fecha_str == '-':
        return None
    
    def es_fecha_iso(fecha_str):
    # Expresión regular para verificar el formato ISO 8601
        patron_iso = r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$'
        return re.match(patron_iso, fecha_str) is not None
    
    if es_fecha_iso(fecha_str):
        try:
            # Convertir la fecha del formato ISO 8601 a un objeto datetime
            fecha_obj = datetime.strptime(fecha_str, '%Y-%m-%dT%H:%M:%S.%f')
        
            # Convertir el objeto datetime al formato 'dd/mm/yyyy'
            fecha_str = fecha_obj.strftime('%d/%m/%Y')
        except ValueError:
            raise ValueError("Error en la conversión de la fecha.")

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
            try:
                fecha_obj = datetime.strptime(str(fecha_str), '%Y/%m/%d')

                return fecha_obj.strftime('%Y-%m-%d')
            except ValueError:

                raise ValueError("El formato de la fecha debe ser 'dd/mm/yyyy', 'yymmdd' o 'yyyy/mm/dd'.")