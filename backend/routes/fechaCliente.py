import os
import pandas as pd
import json
from flask import Blueprint, jsonify, request, current_app, json
from sqlalchemy.sql import text
from db.masterRepo import DatabaseSession
from datetime import datetime
import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask_jwt_extended import jwt_required
from utils.auth_helpers import get_current_grupo_cliente

fechaCliente = Blueprint('fechaCliente', __name__)

def format_time(time_str):
    if time_str is None:
        return None

    try:
        # Intenta parsear con formato de horas:minutos:segundos
        dt = datetime.strptime(time_str, '%H:%M:%S')
    except ValueError:
        try:
            # Intenta parsear con formato de horas:minutos:segundos:milisegundos
            dt = datetime.strptime(time_str, '%H:%M:%S.%f')
        except ValueError:
            # Si el formato no es válido, lanza un error
            return None

    # Devuelve solo horas y minutos en formato HH:MM
    return dt.strftime('%H:%M')

def format_date(date_str):
    if date_str is None:
        return None
    
    try:
        anio = date_str[2:4]
        mes = date_str[5:7]
        dia = date_str[8:10]

        nuevaFecha = dia + "/" + mes + "/" + anio

    except ValueError:
        return None
    
    return nuevaFecha

def format_date_para_url(date_str):
    if date_str is None:
        return None
    
    try:
        anio = date_str[2:4]
        mes = date_str[5:7]
        dia = date_str[8:10]

        nuevaFecha = dia + mes + "20" + anio

    except ValueError:
        return None
    
    return nuevaFecha

def fetch_data(nroCliente, fechaEmision):
    url = f"https://metrogasdocs2.docuprint.com/Api/Form/{nroCliente}/{fechaEmision}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Verifica si hubo un error en la solicitud
        data = response.json()  # Si la respuesta es JSON, la devuelve como un diccionario
        # Asegurarse de que la clave 'Url' existe en la respuesta
        if data:
            return data
        else:
            return None
    except requests.exceptions.RequestException as e:
        return None


@fechaCliente.route('/api/fecha-cliente', methods=['GET'])
@jwt_required()
def tablaFC():
    fechaEmision = request.args.get('fechaEmision')
    numeroCliente = request.args.get('cliente')
    fechaDesde = request.args.get('fechaDesde')
    fechaHasta = request.args.get('fechaHasta')
    grupoCliente = get_current_grupo_cliente()
    lote = request.args.get('lote')  # Nuevo parámetro para el lote

    try:
        # Consulta optimizada: ir directamente a las tablas base
        query = """
            SELECT 
                ie."idEmision",
                ie."idGrupoCliente",
                gc.nombre as "grupoCliente",
                ie."nroCliente",
                ie.titular,
                ie."planTurno",
                ie.sucursal,
                ie.radio,
                ie."estadoPieza",
                ie."estadoMetro",
                ie."geoVisita",
                (ie.calle || ' ' || ie.altura) as direccion,
                ie.localidad,
                ie.foto,
                ie."obsVisita",
                ie."fechaDistrib",
                ie."fechaDistrib" as fecha,
                ie."horaDistrib" as hora,
                ie."fechaEmision",
                ie."fechaCertificacion",
                ie.firma,
                ie."avisoMetro",
                ie."fechaVencimientoMetro",
                ie.vencimiento,
                ie.importe,
                ie.comprobante,
                ie.medidor,
                ie."entreCalles",
                ie."codigoPostal",
                ie."fechaAsignacion",
                ie."fechaIngreso",
                ie.lote,
                ie.cabecera,
                ie."rutaEcogas",
                ie."facturaControl",
                ie.importe
            FROM "itemEmision" ie
            INNER JOIN "grupoCliente" gc ON ie."idGrupoCliente" = gc.id
            WHERE 1=1
        """
        
        params = {}
        
        # Agregar filtros condicionalmente
        if grupoCliente and grupoCliente != 'null':
            query += ' AND ie."idGrupoCliente" = :grupoCliente'
            params['grupoCliente'] = grupoCliente

        if numeroCliente:
            query += ' AND ie."nroCliente" = :numeroCliente'
            params['numeroCliente'] = numeroCliente

        if fechaDesde and fechaHasta:
            query += ' AND ie."fechaDistrib" BETWEEN :fechaDesde AND :fechaHasta'
            params['fechaDesde'] = fechaDesde
            params['fechaHasta'] = fechaHasta
        elif fechaDesde:
            query += ' AND ie."fechaDistrib" >= :fechaDesde'
            params['fechaDesde'] = fechaDesde
        elif fechaHasta:
            query += ' AND ie."fechaDistrib" <= :fechaHasta'
            params['fechaHasta'] = fechaHasta

        if fechaEmision and fechaEmision != 'null':
            query += ' AND ie."fechaEmision" = :fechaEmision'
            params['fechaEmision'] = fechaEmision

        # Nuevo filtro para el lote
        if lote and lote != 'null' and lote != '':
            query += ' AND ie.lote = :lote'
            params['lote'] = lote

        # Agregar ORDER BY
        query += ' ORDER BY ie."nroCliente", ie."fechaDistrib" DESC'

        # Ejecutar la consulta
        with DatabaseSession().get_session() as session:
            result = session.execute(text(query), params)
            session.commit()
            
            # Obtener resultados
            all_rows = list(result)
        
        if not all_rows:
            return jsonify({"message": "Recursos no encontrados"}), 204

        # Procesar resultados
        datosPiezasPostales = []

        # Prefetch en paralelo de la API externa de Metrogas (solo grupo 4):
        # antes se llamaba a fetch_data() una vez por fila, en serie, y cada
        # llamada tarda ~1-1.5s (con 16 filas eso son ~11-16s). Se dedupea
        # por (nroCliente, fechaEmision) y se resuelve todo junto.
        api_cache = {}
        if grupoCliente == '4':
            claves_unicas = {
                (row._mapping.get("nroCliente"), format_date_para_url(row._mapping.get("fechaEmision")))
                for row in all_rows
                if row._mapping.get("fechaEmision")
            }
            if claves_unicas:
                with ThreadPoolExecutor(max_workers=20) as executor:
                    futures = {
                        executor.submit(fetch_data, nc, fe): (nc, fe)
                        for nc, fe in claves_unicas
                    }
                    for future in as_completed(futures):
                        clave = futures[future]
                        api_cache[clave] = future.result()

        for row in all_rows:
            # Obtener diccionario de la fila
            row_dict = dict(row._mapping)

            if grupoCliente == '4':
                res = api_cache.get(
                    (row_dict.get("nroCliente"), format_date_para_url(row_dict.get("fechaEmision")))
                )
                if not isinstance(res, dict):
                    res = {}

                res_venc = res.get("Vencimiento", "0")
                res_imp = str("${:,.2f}".format(res.get("Importe", 0)))
                res_acuse = res.get("Url", "0")
            else:
                res_venc = format_date(row_dict.get("vencimiento"))
                res_imp = row_dict.get("importe", 0)
                res_acuse = "0"

            if grupoCliente == '4' or grupoCliente == '6':
                fecha = format_date(row_dict.get("fechaDistrib"))
            else:
                fecha = format_date(row_dict.get("fechaCertificacion"))
            
            # Procesar obsVisita para Metrogas con estado 1°VBPCR
            obs_visita = row_dict.get("obsVisita")
            if grupoCliente == '4' and row_dict.get("estadoPieza") == "1°VBPCR" and obs_visita:
                obs_visita = limpiar_obs_visita(obs_visita)
        
            datosPiezasPostales.append({
                'id': row_dict.get("idEmision"),
                'fechaEmision': format_date(row_dict.get("fechaEmision")),
                'fechaVencimiento': res_venc,
                'grupoCliente': row_dict.get("grupoCliente"),
                'nroCliente': row_dict.get("nroCliente"),
                'titular': row_dict.get("titular"),
                'plan': row_dict.get("planTurno"),
                'sucursal': row_dict.get("sucursal"),
                'radio': row_dict.get("radio"),
                'direccion': row_dict.get("direccion"),
                'localidad': row_dict.get("localidad"),
                'fecha': fecha,
                'hora': format_time(row_dict.get("hora")), 
                'importe': res_imp,
                'estadoPieza': row_dict.get("estadoPieza"),
                'estadoMetro': row_dict.get("estadoMetro"),
                'obsVisita': obs_visita,
                'geoVisita': row_dict.get("geoVisita"),
                'foto': row_dict.get("foto"),
                'firma': row_dict.get("firma"),
                'acuseDeDeuda': res_acuse,
                'medidor': row_dict.get("medidor"),
                'entreCalles': row_dict.get("entreCalles"),
                'codigoPostal': row_dict.get("codigoPostal"),
                'comprobante': row_dict.get("comprobante"),
                'fechaIngreso': format_date(row_dict.get("fechaIngreso")),
                'lote': row_dict.get("lote"),
                'cabecera': row_dict.get("cabecera"), 
                'rutaEcogas': row_dict.get("rutaEcogas"), 
                'facturaControl': row_dict.get("facturaControl"), 
                'importe': row_dict.get("importe"), 
            })
        
        keys = list(datosPiezasPostales[0].keys())
        
        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500


def limpiar_obs_visita(obs_visita):
    """
    Elimina la parte de DNI y NOMBRE Y APELLIDO del campo obsVisita
    para el estado 1°VBPCR de Metrogas
    """
    import re
    
    # Patrón mejorado para eliminar DNI y NOMBRE Y APELLIDO
    # Ahora permite espacios dentro del DNI y captura nombres completos
    # Coincide con: DNI: 43 662 026, NOMBRE Y APELLIDO: Milagros Castaño,
    # o DNI: 21700565, NOMBRE Y APELLIDO: Marisa vivas,
    patron = r',?\s*DNI:\s*[\d\s]+,\s*NOMBRE Y APELLIDO:\s*[^,]+(?:,|$)'
    
    # Limpiar el texto
    obs_limpiada = re.sub(patron, '', obs_visita)
    
    # Eliminar comas dobles o espacios extra
    obs_limpiada = re.sub(r',\s*,', ',', obs_limpiada)
    obs_limpiada = re.sub(r'\s+', ' ', obs_limpiada).strip()
    
    # Si termina con coma, eliminarla
    if obs_limpiada.endswith(','):
        obs_limpiada = obs_limpiada[:-1]
    
    # Si comienza con espacio, eliminarlo
    if obs_limpiada.startswith(' '):
        obs_limpiada = obs_limpiada[1:]
    
    return obs_limpiada
    
@fechaCliente.route( '/api/lote', methods=['GET'])
@jwt_required()
def getLote():
    
    try:        
        query = text('select distinct(lote) from "itemEmision" where "idGrupoCliente" =6')

        with DatabaseSession().get_session() as session:
            data_query = session.execute(query)
                
        lotes = []

        for row in data_query:
            lotes.append({
                'lotes': row.lote
            })

        if not lotes:
            return '{"message": "Recursos no encontrados"}', 204
        
        keys = list(lotes[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataDropDwn": lotes}), 200
    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500

@fechaCliente.route('/api/fecha/geoMapaItems', methods=['GET'])
@jwt_required()
def mapaItems():
    numeroCliente = request.args.get('cliente')
    fechaDesde = request.args.get('fechaDesde')
    fechaHasta = request.args.get('fechaHasta')
    grupoCliente = get_current_grupo_cliente()
    fechaEmision = request.args.get('fechaEmision')

    try:
        # El mapa solo usa latitud/longitud (ver armarArrayCoordenadas en el
        # frontend); pedir el resto de las columnas de la vista es peso
        # muerto cuando hay cientos de miles de puntos.
        queryBase = 'SELECT gie.latitud, gie.longitud FROM "geoItemEmision" gie'

        where_clauses = []
        qParams = {}

        if grupoCliente:
            where_clauses.append('gie."idGrupoCliente" = :grupoCliente')
            qParams['grupoCliente'] = grupoCliente

        if numeroCliente != '':
            where_clauses.append('gie."nroCliente" = :numeroCliente')
            qParams['numeroCliente'] = numeroCliente

        # Verifica si se proporcionan ambos parámetros de fecha para usar BETWEEN
        if fechaDesde and fechaHasta :
            where_clauses.append('gie."fechaDistrib" BETWEEN :fechaDesde AND :fechaHasta')
            qParams['fechaDesde'] = fechaDesde
            qParams['fechaHasta'] = fechaHasta
        elif fechaDesde:
            # Si solo se proporciona fechaDesde, busca desde esa fecha en adelante
            where_clauses.append('gie."fechaDistrib" >= :fechaDesde')
            qParams['fechaDesde'] = fechaDesde
        elif fechaHasta:
            # Si solo se proporciona fechaHasta, busca hasta esa fecha
            where_clauses.append('gie."fechaDistrib" <= :fechaHasta')
            qParams['fechaHasta'] = fechaHasta
        elif fechaEmision and fechaEmision != 'null':
            where_clauses.append('gie."fechaEmision" = :fechaEmision')
            qParams['fechaEmision'] = fechaEmision

        if where_clauses:
            where_clause = ' WHERE ' + ' AND '.join(where_clauses)
            query = text(queryBase + where_clause)
        else:
            query = text(queryBase)

        with DatabaseSession().get_session() as session:
            data_query = session.execute(query, qParams)
                
        # Pares [lat, lon] en vez de objetos con nombres de columna repetidos
        # por fila: mismo dato, JSON bastante mas chico con muchos puntos.
        puntos = [
            [row.latitud, row.longitud]
            for row in data_query
            if row.latitud and row.longitud
        ]

        if not puntos:
            return '{"message": "Recursos no encontrados"}', 204

        return jsonify({"message": "Conexión y consulta exitosas", "dataTabla": puntos}), 200
    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500

#jsonify lo que hace es convierte lo que trae de la base de datos a json
@fechaCliente.route( '/api/tablaInformacion', methods=['GET'])
@jwt_required()
def tablaInformacion():
    grupoCliente = get_current_grupo_cliente()
    
    try:
        # Datos de ejemplo en la consulta
        data_query = [
            {
                "Empresa": "EMA",
                "ZP": "1° ZP",
                "BP_CR": "BP CR",
                "FAD": "F AD" if grupoCliente == "4" else "F",
                "NV": "NR",
                "UZP": "UZP",
                "ZP_CR_2": "ZP CR",
                "6_DEV": "6 DEV"
            },
            {
                "Empresa": "METROGAS" if grupoCliente == "4" else "NATURGY" if grupoCliente == "2" else "EDESUR",
                "ZP": "BAJO PUERTA",
                "BP_CR": "BAJO PUERTA",
                "FAD": "BAJO FIRMA",
                "NV": "NO RESPONDE LLAMADO",
                "UZP": "BAJO PUERTA",
                "ZP_CR_2": "BAJO PUERTA",
                "6_DEV": "DEVOLUCION",
            },

            
        ]
        
        datosPiezasPostales = []

        # Corregido: Acceso a los datos en el diccionario utilizando corchetes []
        for row in data_query:
            item = {
                'Empresa': row['Empresa'],
                'ZP': row['ZP'],
                'BP_CR': row['BP_CR'],
                'FAD': row['FAD'],
                'NV': row['NV'],
                'UZP': row['UZP'],
                'ZP_CR_2': row['ZP_CR_2'],
                '6_DEV': row['6_DEV'],
            }

            datosPiezasPostales.append(item)

        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 204
        
        keys = list(datosPiezasPostales[0].keys())

        return jsonify({
            "message": "Conexión y consulta exitosas", 
            "columns": keys, 
            "dataTabla": datosPiezasPostales
        }), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
    


@fechaCliente.route( '/api/emisiones', methods=['GET'])
@jwt_required()
def get_emisiones():
    idGrupoCliente = get_current_grupo_cliente()

    try:
        if int(idGrupoCliente) not in (1, 2, 4, 6):
            return jsonify({"message": "idGrupoCliente no válido"}), 400

        # Lee de la tabla resumen (mantenida al importar) en vez de escanear
        # itemEmision/informeClienteMetrogas/informeClienteNaturgy completas.
        queryBase = text(
            'SELECT "fechaEmision" AS nombre, row_number() OVER (ORDER BY "fechaEmision") AS id '
            'FROM "resumenFechasEmision" WHERE "idGrupoCliente" = :idGrupoCliente ORDER BY "fechaEmision"'
        )

        # Ejecutar la consulta
        with DatabaseSession().get_session() as session:
            data_query = session.execute(queryBase, {"idGrupoCliente": int(idGrupoCliente)})

        datosPiezasPostales = [{"id": row.id, "nombre": row.nombre} for row in data_query]

        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 204

        keys = list(datosPiezasPostales[0].keys())

        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "multiplesEmision": datosPiezasPostales}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
    

def buscar_por_id(data, id_buscado):
    for item in data:
        if str(item['id']) == id_buscado:
            return str(item['nombre'])
    return None


@fechaCliente.route( '/api/informe-emision', methods=['GET'])
@jwt_required()
def informeEmision():
    idEmision = request.args.get('idEmision')
    idGrupoCliente = get_current_grupo_cliente()

    try:
        _t0 = time.time()
        # Misma tabla resumen (y mismo orden) que usa /api/emisiones para
        # llenar el desplegable: evita repetir el DISTINCT sin indice sobre
        # las vistas/itemEmision completas, y garantiza que el id elegido en
        # el desplegable se traduzca siempre a la misma fecha.
        queryBaseSearch = text(
            'SELECT "fechaEmision" AS nombre, row_number() OVER (ORDER BY "fechaEmision") AS id '
            'FROM "resumenFechasEmision" WHERE "idGrupoCliente" = :idGrupoCliente ORDER BY "fechaEmision"'
        )

        with DatabaseSession().get_session() as session:
            data_query_search = session.execute(queryBaseSearch, {"idGrupoCliente": int(idGrupoCliente)})

        dataQueryBusqueda = []

        for row in data_query_search:
             dataQueryBusqueda.append({
                'id': row.id,
                'nombre': row.nombre
            })

        fechaEncontrada = buscar_por_id(dataQueryBusqueda, idEmision)

        if int(idGrupoCliente) == 2 and idEmision:
            # La vista "informeClienteNaturgy" dedupea por (nroCliente,
            # estadoPieza) contra TODA la historia antes de que el WHERE de
            # afuera filtre por fecha: un cliente que reaparece en una
            # emision posterior "pisa" su registro de esta emision mas
            # vieja, ademas de escanear todo idGrupoCliente=2 en cada
            # consulta (~6.5s). Se reescribe igual pero filtrando fechaEmision
            # antes del PARTITION BY: cada emision cuenta a sus propios
            # clientes (confirmado con el negocio) y solo escanea esa emision.
            query = '''
                WITH base AS (
                    SELECT ie.id, ie."nroCliente", ie."estadoPieza", ie."fechaEmision",
                        CASE WHEN ie.foto IS NULL THEN 'NO VERIFICADO' ELSE 'VERIFICADO' END AS foto,
                        row_number() OVER (PARTITION BY ie."nroCliente", ie."estadoPieza" ORDER BY ie.id DESC) AS rn
                    FROM "itemEmision" ie
                    WHERE ie."idGrupoCliente" = 2 AND ie."estadoMetro" IS NULL AND ie."fechaEmision" = :fechaEmision
                )
                SELECT row_number() OVER () AS id, "estadoPieza", "fechaEmision", foto, count("nroCliente") AS count
                FROM base WHERE rn = 1
                GROUP BY "estadoPieza", foto, "fechaEmision"
            '''
            qParams = {'fechaEmision': fechaEncontrada}
        else:
            if int(idGrupoCliente) == 4:
                queryBase = 'SELECT * FROM "informeClienteMetrogas" icm'
            elif int(idGrupoCliente) == 2:
                queryBase = 'SELECT * FROM "informeClienteNaturgy" icn'
            elif int(idGrupoCliente) == 6:
                queryBase = 'SELECT * FROM "informeClienteEcogas" ie'

            where_clauses = []
            qParams = {}

            # Verificar y agregar los parámetros condicionalmente
            if idEmision and int(idGrupoCliente) == 4:
                where_clauses.append('icm."fechaEmision" = :fechaEmision')
                qParams['fechaEmision'] = fechaEncontrada
            elif idEmision and int(idGrupoCliente) == 6:
                where_clauses.append('ie."fechaEmision" = :fechaEmision')
                qParams['fechaEmision'] = fechaEncontrada

            # Combinar cláusulas WHERE si existen
            if where_clauses:
                where_clause = ' WHERE ' + ' AND '.join(where_clauses)
                query = queryBase + where_clause
            else:
                query = queryBase

        # Convertir a TextClause después de armar la consulta completa
        query = text(query + " ORDER BY count DESC")

        # Ejecutar la consulta
        _t1 = time.time()
        with DatabaseSession().get_session() as session:
            data_query = session.execute(query, qParams)
            data_query = list(data_query)

        datosPiezasPostales = []

        for row in data_query:
            if int(idGrupoCliente) == 4:
                datosPiezasPostales.append({
                    'id': row.id, 
                    #'idEmision': row.idEmision,
                    'fechaEmision': row.fechaEmision,
                    'localidad': row.localidad,
                    'estadoPieza': row.estadoPieza,
                    'estadoMetro': row.estadoMetro,
                    'count': str(row.count),
                })
            elif int(idGrupoCliente) == 2:
                datosPiezasPostales.append({
                    'id': row.id, 
                    #'idEmision': row.idEmision,
                    'fechaEmision': row.fechaEmision,
                    'condicion': row.foto,
                    'estadoPieza': row.estadoPieza,
                    'count': str(row.count),
                })
            elif int(idGrupoCliente) == 6:
                datosPiezasPostales.append({
                    'id': row.id, 
                    #'idEmision': row.idEmision,
                    'fechaEmision': row.fechaEmision,
                    'estadoPieza': row.estadoPieza,
                    'count': str(row.count),
                })

        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 204

        keys = list(datosPiezasPostales[0].keys())
        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500


@fechaCliente.route('/api/informe-emision-extendido', methods=['GET'])
@jwt_required()
def informeEmisionExtendido():
    idEmision = request.args.get('idEmision')
    idGrupoCliente = get_current_grupo_cliente()
    
    try:
        if int(idGrupoCliente) == 4:
            queryBaseSearch = text('''
                SELECT DISTINCT("fechaEmision") AS nombre, 
                       row_number() OVER () AS id 
                FROM "informeClienteMetrogas" icm 
                GROUP BY "fechaEmision" 
                ORDER BY 1
            ''')
        elif int(idGrupoCliente) == 2:
            queryBaseSearch = text('''
                SELECT DISTINCT("fechaEmision") AS nombre, 
                       row_number() OVER () AS id 
                FROM "informeClienteNaturgy" icn 
                GROUP BY "fechaEmision" 
                ORDER BY 1
            ''')
        
        # Obtener lista de fechas
        with DatabaseSession().get_session() as session:
            data_query_search = session.execute(queryBaseSearch)
        
        dataQueryBusqueda = []
        for row in data_query_search:
            dataQueryBusqueda.append({
                'id': row.id, 
                'nombre': row.nombre
            })
        
        fechaEncontrada = buscar_por_id(dataQueryBusqueda, idEmision)
        
        # Armar query según grupo de cliente
        qParams = {}
        if int(idGrupoCliente) == 4:
            queryBase = 'SELECT * FROM "fechaCliente" fc'
            where_clauses = []
            
            if idEmision:
                where_clauses.append('fc."fechaEmision" = :fechaEmision')
                qParams['fechaEmision'] = fechaEncontrada
            where_clauses.append('fc."idGrupoCliente" = :idGrupoCliente')
            qParams['idGrupoCliente'] = int(idGrupoCliente)
            
            if where_clauses:
                queryBase += ' WHERE ' + ' AND '.join(where_clauses)
        
        elif int(idGrupoCliente) == 2:
            # Para Naturgy, traer solo el último registro por cliente y estado
            queryBase = '''
                SELECT *
                FROM (
                    SELECT fc.*, 
                           ROW_NUMBER() OVER (
                               PARTITION BY fc."nroCliente", fc."estadoPieza" 
                               ORDER BY fc."fecha" DESC, fc."hora" DESC, fc."id" DESC
                           ) AS rn
                    FROM "fechaCliente" fc
                    WHERE fc."idGrupoCliente" = :idGrupoCliente and "estadoMetro" is null
            '''
            qParams['idGrupoCliente'] = int(idGrupoCliente)
            
            if idEmision:
                queryBase += ' AND fc."fechaEmision" = :fechaEmision'
                qParams['fechaEmision'] = fechaEncontrada
            
            queryBase += ') sub WHERE rn = 1'
        
        # Ejecutar la consulta
        with DatabaseSession().get_session() as session:
            data_query = session.execute(text(queryBase), qParams)
        
        datosPiezasPostales = []
        for row in data_query:
            if int(idGrupoCliente) == 4:
                # Procesar obsVisita para Metrogas
                obs_visita = row.obsVisita
                if row.estadoPieza == "1°VBPCR" and obs_visita:
                    obs_visita = limpiar_obs_visita(obs_visita)
                
                datosPiezasPostales.append({
                    'id': row.id,
                    'fechaEmision': format_date(row.fechaEmision),
                    'fechaVencimiento': format_date(row.vencimiento),
                    'nroCliente': row.nroCliente,
                    'titular': row.titular,
                    'plan': row.planTurno,
                    'sucursal': row.sucursal,
                    'radio': row.radio,
                    'direccion': row.direccion,
                    'localidad': row.localidad,
                    'fecha': format_date(row.fecha),
                    'hora': format_time(row.hora),
                    'estadoPieza': row.estadoPieza,
                    'estadoMetro': row.estadoMetro,
                    'obsVisita': obs_visita,
                    'geoVisita': row.geoVisita,
                    'foto': row.foto,
                    'firma': row.firma
                })
            elif int(idGrupoCliente) == 2:
                datosPiezasPostales.append({
                    'id': row.id,
                    'fechaEmision': format_date(row.fechaEmision),
                    'nroCliente': row.nroCliente,
                    'titular': row.titular,
                    'direccion': row.direccion,
                    'localidad': row.localidad,
                    'fecha': format_date(row.fecha),
                    'estadoPieza': row.estadoPieza,
                    'obsVisita': row.obsVisita,
                    'geoVisita': row.geoVisita,
                    'foto': row.foto,
                    'firma': row.firma
                })
        
        if not datosPiezasPostales:
            return jsonify({"message": "Recursos no encontrados"}), 204
        
        keys = list(datosPiezasPostales[0].keys())
        return jsonify({"message": "Conexión y consulta exitosas", "columns": keys, "dataTabla": datosPiezasPostales}), 200

    except Exception as e:
        return jsonify({"message": f"Error al ejecutar la consulta: {str(e)}"}), 500
