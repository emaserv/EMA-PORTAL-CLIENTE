"""
Procesador por lotes para generar múltiples acuses eficientemente
"""
import io
import os
import shutil
import tempfile
import zipfile
import json
import re
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from datetime import datetime
from db.masterRepo import DatabaseSession
from models.emision.ItemEmision import ItemEmision
from image_generator import image_generator
import csv

class BatchProcessor:
    """
    Procesa lotes de acuses de manera eficiente SIN CACHE
    """
    
    def __init__(self, max_workers=18):
        self.max_workers = max_workers
    
    def obtener_metadata_lote(self, lote_param, nroCliente=None):
        """
        Obtiene metadata de todos los acuses de un lote
        SIN current_app.app_context() - asume que ya está en contexto
        """
        
        estados_validos = ['DV', 'DR', 'DM', 'F AD', 'F ZP AD', '1° ZP', 'BP CR', 'ZPBP', 'UZP']
        
        with DatabaseSession().get_session() as session:
            # Obtener lotes si no se especifica uno
            if lote_param:
                lotes = [lote_param]
            else:
                query = session.query(ItemEmision.lote).filter(
                    ItemEmision.nroCliente == nroCliente,
                    ItemEmision.idGrupoCliente == 2
                ).distinct()
                lotes = [row[0] for row in query.all()]
            
            all_metadata = []
            
            for lote in lotes:
                # Consulta principal
                query = session.query(ItemEmision).filter(
                    ItemEmision.lote == lote,
                    ItemEmision.estadoPieza.in_(estados_validos),
                    ItemEmision.estadoMetro.is_(None)
                )
                
                if nroCliente:
                    query = query.filter(ItemEmision.nroCliente == nroCliente)
                
                query = query.order_by(ItemEmision.nroCliente)
                #query = query.limit(100)
                #print(f" MODO PRUEBA: Limitando a 500 registros")
                resultados = query.all()
                
                # Obtener registros NR para segunda visita
                nroClientes = list(set(item.nroCliente for item in resultados))
                registros_nr = session.query(ItemEmision).filter(
                    ItemEmision.lote == lote,
                    ItemEmision.estadoPieza == 'NR',
                    ItemEmision.nroCliente.in_(nroClientes)
                ).all()
                
                nr_por_cliente = {item.nroCliente: item for item in registros_nr}
                
                # Procesar cada item
                for item in resultados:
                    metadata = self._item_a_metadata(item, nr_por_cliente)
                    all_metadata.append(metadata)
                
                return all_metadata
    
    def _item_a_metadata(self, item, nr_por_cliente):
        """Convierte un ItemEmision a metadata estructurada"""
        # Parsear observaciones
        obs = self._parse_obs_visita(item.obsVisita)
        
        # Determinar estado y descripción
        estado = item.estadoPieza
        descripcion = (
            "Otros" if estado == "DV" else
            "Rehusado" if estado == "DR" else
            "Se mudó" if estado == "DM" else None
        )
        
        tipo_entrega = (
            "Bajo Puerta" if estado in ["1° ZP", "BP CR", "ZPBP", "UZP"] else
            "Firmada" if estado in ["F AD", "F ZP AD"] else
            "Otros" if estado == "DV" else
            "Rehusado" if estado == "DR" else
            "Se mudó" if estado == "DM" else None
        )
        
        # Segunda visita - INICIALIZAR primero
        segunda_visita = {}
        fecha = item.fechaDistrib or ""
        hora = item.horaDistrib or ""
        
        if estado in ['1° ZP', 'BP CR', 'ZPBP', 'UZP']:
            # Crear diccionario de segunda visita
            segunda_visita = {
                "fecha2": item.fechaDistrib or "",
                "hora2": item.horaDistrib or ""
            }
            nr_item = nr_por_cliente.get(item.nroCliente)
            if nr_item:
                fecha = nr_item.fechaDistrib or ""
                hora = nr_item.horaDistrib or ""

        # Validar geo antes de agregar
        geo = item.geoVisita or ""
        if geo and 'q=' in geo:
            import re
            if not re.search(r'q=(-?\d+\.\d+),(-?\d+\.\d+)', geo):
                # Marcar como inválido
                geo = ""
        
        nro_cliente = str(item.nroCliente)
        if nro_cliente.isdigit() and len(nro_cliente) < 7:
            nro_cliente = nro_cliente.zfill(7)
        
        # Crear metadata
        metadata = {
            "importe": item.importe,
            "fechaEmision": item.fechaEmision,
            "vencimiento": item.vencimiento,
            "nroCliente": nro_cliente,  
            "medidor": item.medidor,
            "nombreCliente": item.titular,
            "comprobante": item.comprobante,
            "direccion": f"{item.calle or ''} {item.altura or ''}".strip(),
            "entreCalle": item.entreCalles,
            "codigoPostal": f"{item.codigoPostal or ''} - {item.localidad or ''}".strip(),
            "codigoBarras": item.codigoBarras,
            "fecha": fecha,
            "hora": hora,
            "distribuidor": f"{item.legajo or ''} - {item.distribuidor or ''}".strip(),
            "dni": obs.get("dni", ""),
            "aclaracion": obs.get("aclaracion", ""),
            "vinculo": obs.get("vinculo", ""),
            "referencia1": obs.get("referencia1", ""),
            "referencia2": obs.get("referencia2", ""),
            "referencia3": obs.get("referencia3", ""),
            "descripcion": descripcion or "",
            "foto_url": item.foto or "",
            "firma_url": item.firma or "",
            "geo": geo,
            "segundaVisita": segunda_visita,
            "tipoEntrega": tipo_entrega or "",
        }
        
        # Convertir segundaVisita a JSON string si es diccionario
        if isinstance(metadata['segundaVisita'], dict):
            metadata['segundaVisita'] = json.dumps(metadata['segundaVisita'])
        
        return metadata
    
    def _parse_obs_visita(self, obs):
        """Parsear observaciones de visita - VERSIÓN SEGURA"""
        datos = {
            "dni": "", 
            "aclaracion": "", 
            "vinculo": "", 
            "referencia1": "", 
            "referencia2": "", 
            "referencia3": ""
        }
        
        if not obs or not isinstance(obs, str):
            return datos
        
        try:
            dni_match = re.search(r"DNI:\s*([\d\s\.]+)", obs)
            nombre_match = re.search(r"NOMBRE Y APELLIDO:\s*([^,]+)", obs)
            vinculo_match = re.search(r"VINCULO:\s*([^,]+)", obs, re.IGNORECASE)
            
            def ref_con_color(n):
                ref = re.search(rf"{n}° REFERENCIA:\s*([^,]+)", obs)
                color = re.search(rf"{n}° COLOR:\s*([^,]+)", obs)
                if ref:
                    ref_text = ref.group(1).strip() if ref.group(1) else ""
                    color_text = color.group(1).strip() if color and color.group(1) else ""
                    return f"{ref_text} {color_text}".strip() if color_text else ref_text
                return ""
            
            if dni_match and dni_match.group(1):
                datos["dni"] = re.sub(r"\D", "", dni_match.group(1))
            if nombre_match and nombre_match.group(1):
                datos["aclaracion"] = nombre_match.group(1).strip()
            if vinculo_match and vinculo_match.group(1):
                datos["vinculo"] = vinculo_match.group(1).strip()
            
            datos["referencia1"] = ref_con_color(1)
            datos["referencia2"] = ref_con_color(2)
            datos["referencia3"] = ref_con_color(3)
            
        except Exception as e:
            print(f"Error en _parse_obs_visita: {e}")
        
        return datos
    
    def generar_acuse(self, index, metadata):
        """
        Genera un acuse JPG en memoria y captura errores sin detener
        """
        errores = []

        try:
            nro_cliente = metadata.get('nroCliente', f'idx_{index}')
            codigo_barras = metadata.get('codigoBarras', f'barcode_{index}')

            geo = metadata.get('geo', '')
            if not geo or not isinstance(geo, str):
                errores.append("No se genero mapa, coordenadas incorrectas")
            elif 'q=' in geo:
                geo_match = re.search(r'q=(-?\d+\.\d+),(-?\d+\.\d+)', geo)
                if not geo_match:
                    errores.append("Coordenadas inválidas en mapa")

            # Verificar datos críticos ANTES de generar
            if not metadata.get('direccion'):
                errores.append("Sin dirección")

            if not metadata.get('nombreCliente'):
                errores.append("Sin nombre de cliente")

            # Generar JPG
            jpg_bytes = image_generator.generate_acuse_jpg(metadata, quality=60)

            if not jpg_bytes:
                errores.append("No se generó imagen")
                return {
                    "success": False,
                    "nroCliente": nro_cliente,
                    "errores": errores
                }

            # Nombre seguro del archivo
            safe_barcode = str(codigo_barras).replace('/', '_').replace('\\', '_')

            return {
                "success": True,
                "filename": f"_{safe_barcode}.jpg",
                "jpg_bytes": jpg_bytes,
                "nroCliente": nro_cliente,
                "errores": errores
            }

        except Exception as e:
            error_msg = str(e)

            # Detectar tipo de error
            if "mapa" in error_msg.lower() or "geo" in error_msg.lower():
                errores.append("Error en mapa")
            elif "foto" in error_msg.lower() or "imagen" in error_msg.lower():
                errores.append("Error en foto")
            elif "firma" in error_msg.lower():
                errores.append("Error en firma")
            else:
                errores.append(f"Error: {error_msg[:50]}...")

            return {
                "success": False,
                "nroCliente": metadata.get('nroCliente', f'idx_{index}'),
                "errores": errores
            }

    def generar_acuses_batch(self, metadata_list, zipf, update_progress=None, check_cancelled_callback=None):
        """
        Genera los JPGs en paralelo y los escribe directo en el ZIP abierto.

        Usa una ventana deslizante: apenas termina un acuse se encola el
        siguiente, así un acuse lento (descarga con timeout) no deja a los
        demás hilos esperando como pasaba al procesar por bloques fijos.
        El ZIP se escribe solo desde este hilo (zipfile no es thread-safe).
        """
        total = len(metadata_list)
        archivos_generados = set()
        errores_totales = []

        max_en_vuelo = self.max_workers * 2
        processed_count = 0
        next_index = 0
        pending = {}

        executor = ThreadPoolExecutor(max_workers=self.max_workers)
        try:
            while next_index < total or pending:
                if check_cancelled_callback and check_cancelled_callback():
                    break

                while next_index < total and len(pending) < max_en_vuelo:
                    metadata = metadata_list[next_index]
                    future = executor.submit(self.generar_acuse, next_index, metadata)
                    pending[future] = (next_index, metadata)
                    next_index += 1

                done, _ = wait(pending, return_when=FIRST_COMPLETED)

                for future in done:
                    i, metadata = pending.pop(future)
                    processed_count += 1
                    try:
                        resultado = future.result()

                        if resultado.get("success"):
                            filename = resultado["filename"]
                            # Mismo código de barras = mismo nombre: se escribe una sola vez
                            if filename not in archivos_generados:
                                zipf.writestr(filename, resultado["jpg_bytes"])
                                archivos_generados.add(filename)

                        if resultado.get("errores") and len(resultado["errores"]) > 0:
                            errores_totales.append({
                                "nroCliente": resultado.get("nroCliente", f"idx_{i}"),
                                "errores": ", ".join(resultado["errores"]) if isinstance(resultado["errores"], list) else str(resultado["errores"])
                            })

                    except Exception as e:
                        print(f"Error procesando acuse {i}: {e}")
                        errores_totales.append({
                            "nroCliente": metadata.get('nroCliente', f"idx_{i}"),
                            "errores": f"Error crítico: {str(e)[:100]}"
                        })

                if update_progress:
                    percent = int((processed_count / total) * 100)
                    update_progress(f"Procesados {processed_count}/{total} acuses... • {percent}%")
        finally:
            # Si se canceló, descartar lo que no empezó
            executor.shutdown(wait=True, cancel_futures=True)

        return archivos_generados, errores_totales

    def procesar_lote_completo(self, lote, nroCliente=None, update_progress=None, check_cancelled_callback=None):
        """
        Procesa un lote completo - CON VERIFICACIÓN DE CANCELACIÓN
        """
        try:
            if check_cancelled_callback and check_cancelled_callback():
                return None, "Procesamiento cancelado", []
            
            if update_progress:
                update_progress("Obteniendo datos...")
            
            if check_cancelled_callback and check_cancelled_callback():
                return None, "Procesamiento cancelado", []
            
            metadata_list = self.obtener_metadata_lote(lote, nroCliente)
            
            if not metadata_list:
                return None, "No hay datos para generar", []
            
            total = len(metadata_list)
            
            if check_cancelled_callback and check_cancelled_callback():
                return None, "Procesamiento cancelado", []
            
            temp_dir = tempfile.mkdtemp(prefix=f"acuses_{lote}_")
            
            if update_progress:
                update_progress(f"Generando acuses... (0/{total})")
            
            def progress_callback(msg):
                if update_progress:
                    update_progress(msg)
                if check_cancelled_callback and check_cancelled_callback():
                    raise InterruptedError("Procesamiento cancelado")
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            zip_path = os.path.join(temp_dir, f"acuses_{lote}_{timestamp}.zip")

            try:
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    archivos_generados, errores_totales = self.generar_acuses_batch(
                        metadata_list,
                        zipf,
                        progress_callback,
                        check_cancelled_callback
                    )

                    cancelado = check_cancelled_callback and check_cancelled_callback()
                    if errores_totales and archivos_generados and not cancelado:
                        reporte = io.StringIO(newline='')
                        writer = csv.DictWriter(reporte, fieldnames=['nroCliente', 'errores'])
                        writer.writeheader()

                        for error in errores_totales:
                            nro_cliente = error['nroCliente']
                            nro_cliente_csv = f"\t{nro_cliente}"

                            writer.writerow({
                                'nroCliente': nro_cliente_csv,
                                'errores': error['errores']
                            })

                        zipf.writestr(f"errores_{lote}.csv", reporte.getvalue().encode('utf-8'))
            except InterruptedError:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return None, "Procesamiento cancelado", []

            if check_cancelled_callback and check_cancelled_callback():
                shutil.rmtree(temp_dir, ignore_errors=True)
                return None, "Procesamiento cancelado", []

            if not archivos_generados:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return None, "No se pudieron generar acuses", errores_totales

            return zip_path, None, errores_totales
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return None, str(e), []

batch_processor = BatchProcessor(max_workers=18)