from sqlalchemy import func, cast, Text, text
from models.dai.Dai import Dai
from db.QueryObj import QueryObj
from db.masterRepo import DatabaseSession
from flask import Blueprint, jsonify, request, current_app, json
from datetime import datetime

class AdapterDAI:
    def leerDAI(entry):
        print("WASAAAAAAAAAAAAAA", entry['Legajos'])
                
        dai = Dai(
            idGrupoCliente = obtenerIdGrupoCliente(entry['Grupo Cliente']), 
            legajoDist = str(entry['Legajos']) if entry['Legajos'] != None else None,
            fecha =  convertir_fecha(entry['date']),
            hora =  chequeadorHora(entry['time']),
            latitud = str(entry['Latstud']) if entry['Latitud'] != None else None,
            longitud =  str(entry['Longitud']) if entry['Longitud'] != None else None,
        )
    
        return dai
    
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