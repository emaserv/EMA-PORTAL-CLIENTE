from sqlalchemy import func, cast, Text, text
from models.emision.ItemEmision import ItemEmision
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
            calle = obtenerPorPartes(str(entry['Dirección']), True),
            altura = obtenerPorPartes(str(entry['Dirección']), False),
            localidad = str(entry['Localidad']) if entry['Localidad'] != 'None' else None,
            planTurno = entry['Plan'] if entry['Plan'] else None,
            sucursal = entry['Sucursal'] if entry['Sucursal'] else None,
            radio = entry['Radio'] if entry['Radio'] else None,
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
            fechaAsignacion = convertir_fecha(entry['Fecha Asignacion']),
            tipoDePieza = entry['Tipo de Servicio'] if entry['Tipo de Servicio'] else None, 
            codigoBarras = entry['Codigo de Barras'] if entry['Codigo de Barras'] else None,
            vencimiento = convertir_fecha(entry['Vencimiento']),
            importe = entry['Importe'] if entry['Importe'] else None,
            comprobante = entry['Comprobante'] if entry['Comprobante'] else None,
            medidor = entry['Medidor'] if entry['Medidor'] else None,
            entreCalles = entry['Entre Calles'] if entry['Entre Calles'] else None,
            codigoPostal = entry['Codigo Postal'] if entry['Codigo Postal'] else None,
            rutaEcogas = entry['Ruta Ecogas'] if entry['Ruta Ecogas'] else None,
            cabecera = entry['Cabecera'] if entry['Cabecera'] else None,
            facturaControl = entry['Factura Control'] if entry['Factura Control'] else None,
        )
        print('pase el primero')

        return itemEmision
    

def chequeadorHora(hora):
    if hora and hora != '-':
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
        # yyyy-mm-ddTHH:MM:SS.sss
        fecha_obj = datetime.strptime(fecha_str, '%Y-%m-%dT%H:%M:%S.%f')
    except ValueError:
        try:
            # yyyy-mm-dd HH:MM:SS (el que rompe)
            fecha_obj = datetime.strptime(fecha_str, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            try:
                # dd/mm/yyyy
                fecha_obj = datetime.strptime(fecha_str, '%d/%m/%Y')
            except ValueError:
                try:
                    # dd/mm/yy
                    fecha_obj = datetime.strptime(fecha_str, '%d/%m/%y')
                except ValueError:
                    raise ValueError("El formato de la fecha debe ser 'dd/mm/yyyy', 'yyyy-mm-ddTHH:MM:SS.sss', 'yyyy-mm-dd HH:MM:SS' o 'dd/mm/yy'")

    return fecha_obj.strftime('%Y-%m-%d')
    
def chequeadorFoto(linkFoto):
    if linkFoto == 'https://s3.amazonaws.com/ocrbsas-userfiles-mobilehub-94990329/':
        return None
    else:
        return linkFoto
    

  #  https://emalector-epec.s3.amazonaws.com/ema-psm/


# https://s3.amazonaws.com/ocrbsas-userfiles-mobilehub-94990329/