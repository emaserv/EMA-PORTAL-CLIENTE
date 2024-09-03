from sqlalchemy import func, cast, Text, text
from models.emision.ItemEmision import ItemEmision
from db.QueryObj import QueryObj
from db.masterRepo import DatabaseSession
from flask import Blueprint, jsonify, request, current_app, json
import re
from datetime import datetime

class AdapterPSM:
    def leerItemEmision(entry, idEmision):
        itemEmision = ItemEmision(
            nroCliente = entry['Número de Cuenta'],
            titular = entry['Nombre del Titular'], 
            calle = obtenerPorPartes(entry['Dirección'], True),
            altura = obtenerPorPartes(entry['Dirección'], False),
            idEmision = idEmision,
            sucursal = entry['sucursal'],
            planTurno = entry['plan'],
            radio = entry['radio'],
            ruta = entry['Ruta'],
            distribuidor = entry['Nombre'],
            estadoPieza = entry['Estado'],
            obsInterna = None,
            obsVisita = entry['Observación'],
            fechaDistrib = convertir_fecha(entry['Fecha']),
            horaDistrib = entry['Hora'],
            geoCliente = None,
            geoVisita = None,
            foto = entry['Foto'],
            idGrupoCliente = obtenerIdGrupoCliente(entry['Cliente']), 
            lote = entry['Lote'],
            legajo = entry['Legajo'],
            tipoDePieza = None, 
            localidad = entry['Localidad'],
            firma = entry['Firma'],
        )

        return itemEmision
    
def separar_por_dos_numeros(cadena):
    # Busca el primer lugar donde aparecen dos dígitos consecutivos
    match = re.search(r'\d{2}', cadena)
    
    if match:
        # Obtiene el índice de donde empiezan los dos números consecutivos
        indice = match.start()
        # Divide la cadena en el índice encontrado
        return cadena[:indice].strip(), cadena[indice:].strip()
    
    # Si no encuentra dos números consecutivos, retorna la cadena original
    return cadena, ""

#si pongo true me devuelve letras si no el restop
def obtenerPorPartes(cadena, letras):
    calle, altura = separar_por_dos_numeros(cadena)
    if letras:
        return calle
    else:
        return altura
    

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