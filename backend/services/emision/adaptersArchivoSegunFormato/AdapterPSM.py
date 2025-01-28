from sqlalchemy import func, cast, Text, text
from models.emision.ItemEmision import ItemEmision
from db.QueryObj import QueryObj
from db.masterRepo import DatabaseSession
from flask import Blueprint, jsonify, request, current_app, json
import re
from datetime import datetime

class AdapterPSM:
    def leerItemEmision(entry, idEmision):

        print("WASAAAAAAAAAAAAAA", entry['Cliente'])

        itemEmision = ItemEmision(
            idEmision = idEmision,
            idGrupoCliente = obtenerIdGrupoCliente(entry['Cliente']), 
            nroCliente = entry['Número de Cuenta'] if entry['Número de Cuenta'] else None,
            titular = entry['Nombre del Titular'] if entry['Nombre del Titular'] else None, 
            calle = obtenerPorPartes(entry['Dirección'], True),
            altura = obtenerPorPartes(entry['Dirección'], False),
            localidad = entry['Localidad'] if entry['Localidad'] != 'None' else None,
            planTurno = entry['plan'] if entry['plan'] else None,
            sucursal = entry['sucursal'] if entry['sucursal'] else None,
            radio = entry['radio'] if entry['radio'] else None,
            lote = entry['Lote'] if entry['Lote'] else None,
            recorridoH = entry['Recorrido H'] if entry['Recorrido H'] else None,
            ruta = entry['Ruta'] if entry['Ruta'] else None,
            estadoPieza = entry['Estado'] if entry['Estado'] else None,
            legajo = entry['Legajo'] if entry['Legajo'] else None,
            distribuidor = entry['Nombre'] if entry['Nombre'] else None,
            supervisor = entry['Supervisor'] if entry['Supervisor'] else None,
            fechaDistrib = convertir_fecha(entry['Fecha']),
            horaDistrib = chequeadorHora(entry['Hora']),
            obsInterna = entry['Observacion Usuario'] if entry['Observacion Usuario'] else None,
            obsVisita = entry['Observación'] if entry['Observación'] else None,
            foto = chequeadorFoto(entry['Foto']),
            firma = entry['Firma'] if entry['Firma'] else None,
            geoVisita = entry['Ubicación en Mapa'] if entry['Ubicación en Mapa'] else None,
            fechaIngreso = convertir_fecha(entry['Fecha Ingreso']),
            fechaEmision = convertir_fecha(entry['Fecha Emision']),
            fechaCertificacion = convertir_fecha(entry['Fecha Certificacion']),
            tipoDePieza = entry['Tipo de Servicio'] if entry['Tipo de Servicio'] else None, 
            codigoBarras = entry['Codigo de Barras'] if entry['Codigo de Barras'] else None
        )
        print('pase el primero')

        return itemEmision
    

def chequeadorHora(hora):
    print('HORAAAA', hora)
    if hora != '-':
        return hora
    else:
        return None
    
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
    if nombreGrupoCliente.find("EDESUR") != -1:
        nombreGrupoCliente = "EDESUR"

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
        print("ENCONTRADO", row.id)
        return row.id

    except Exception as e:
        print(f"Error al ejecutar la consulta: {str(e)}")
        return None
    
  
def convertir_fecha(fecha_str):
    print(fecha_str)

    if fecha_str is None:
        return None
    
    try:
        # Intentar convertir la fecha con el formato ISO 'yyyy-mm-ddTHH:MM:SS.sss'
        fecha_obj = datetime.strptime(fecha_str, '%Y-%m-%dT%H:%M:%S.%f')
    except ValueError:
        try:
            # Intentar convertir la fecha con el formato 'dd/mm/yyyy'
            fecha_obj = datetime.strptime(fecha_str, '%d/%m/%Y')
        except ValueError:
            try:
                # Intentar convertir la fecha con el formato 'dd/mm/yy'
                fecha_obj = datetime.strptime(fecha_str, '%d/%m/%y')
            except ValueError:
                # Manejo de errores si el formato de entrada es incorrecto
                raise ValueError("El formato de la fecha debe ser 'dd/mm/yyyy' o 'yyyy-mm-ddTHH:MM:SS.sss'. o 'dd/mm/yy'" )

    # Convertir el objeto datetime al formato 'yyyy-mm-dd'
    return fecha_obj.strftime('%Y-%m-%d')
    
def chequeadorFoto(linkFoto):
    print(linkFoto)
    if linkFoto == 'https://s3.amazonaws.com/ocrbsas-userfiles-mobilehub-94990329/':
        return None
    else:
        return linkFoto