"""
Endpoints asíncronos para generación de acuses
"""
import os
import sys
import threading
import uuid
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, current_app

current_file = os.path.abspath(__file__)          
routes_dir = os.path.dirname(current_file)        
backend_dir = os.path.dirname(routes_dir)         
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

acuses_async = Blueprint('acuses_async', __name__)

tasks = {}
generation_in_progress = False
current_task_id = None

class AsyncTask:
    """Clase para manejar tareas asíncronas"""
    
    def __init__(self, task_id, lote, nroCliente=None, flask_context=None):
        self.task_id = task_id
        self.lote = lote
        self.nroCliente = nroCliente
        self.flask_context = flask_context
        self.status = "pending"
        self.progress = 0
        self.message = "Iniciando..."
        self.result = None
        self.error = None
        self.zip_path = None
        self.start_time = None
        self.end_time = None
        
        self._cancelled = False
        self._cancel_lock = threading.Lock()
        
        # Iniciar en hilo separado
        self.thread = threading.Thread(target=self._execute, daemon=True)
        self.thread.start()
    
    def cancel(self):
        """Marca la tarea para cancelación"""
        with self._cancel_lock:
            if self.status in ["pending", "processing"]:
                self._cancelled = True
                return True
        return False
    
    def is_cancelled(self):
        """Verifica si la tarea fue cancelada"""
        with self._cancel_lock:
            return self._cancelled
    
    def _execute(self):
        """Ejecuta la generación en segundo plano"""
        try:
            if self.flask_context:
                with self.flask_context():
                    self._execute_in_context()
            else:
                self._execute_with_fallback()
                
        except Exception as e:
            if not self.is_cancelled():
                self.status = "failed"
                self.error = str(e)
                self.message = f"Error en generación: {str(e)}"
                import traceback
                traceback.print_exc()
        
        finally:
            # SIEMPRE liberar el bloqueo global cuando termine
            self._release_global_lock()
    
    def _release_global_lock(self):
        """Libera el bloqueo global si esta tarea es la actual"""
        global generation_in_progress, current_task_id
        
        if current_task_id == self.task_id:
            generation_in_progress = False
            current_task_id = None
            print(f"🔓 [LOCK] Generación {self.task_id} terminada. Bloqueo liberado.")
    
    def _execute_in_context(self):
        """Ejecuta dentro del contexto Flask - CON MANEJO CORRECTO DE CONTEXTO"""
        
        from batch_processor import batch_processor
        
        # Inicializar variables
        self.errores = []
        self.total_generados = 0
        self.total_con_errores = 0
        
        # Verificar cancelación ANTES de empezar
        if self.is_cancelled():
            self.status = "cancelled"
            self.message = "Cancelada antes de comenzar"
            self.end_time = json.dumps(str(datetime.now()))
            return
        
        self.start_time = json.dumps(str(datetime.now()))
        self.status = "processing"
        self.progress = 5
        self.message = "Obteniendo datos del lote..."
        
        # Función de actualización de progreso
        def update_progress(msg):
            if self.is_cancelled():
                raise InterruptedError("Tarea cancelada por el usuario")
            
            self.message = msg
            if "Acuse" in msg and "/" in msg:
                try:
                    current, total = msg.split("Acuse ")[1].split("/")
                    current = int(current.strip())
                    total = int(total.strip().split(" ")[0])
                    self.progress = 5 + int((current / total) * 90)
                except:
                    pass
        
        try:
            zip_path, error, errores_totales = batch_processor.procesar_lote_completo(
                lote=self.lote,
                nroCliente=self.nroCliente,
                update_progress=update_progress,
                check_cancelled_callback=lambda: self.is_cancelled()
            )
            
            self.errores = errores_totales if errores_totales else []
            self.total_con_errores = len(self.errores)
            
            # Verificar si fue cancelada DURANTE el procesamiento
            if self.is_cancelled():
                self.status = "cancelled"
                self.message = "Cancelada por el usuario"
                # Limpiar archivo si se creó
                if zip_path and os.path.exists(zip_path):
                    try:
                        os.remove(zip_path)
                    except:
                        pass
            elif error:
                self.status = "failed"
                self.error = error
                self.message = f"Error: {error}"
            else:
                self.status = "completed"
                self.progress = 100
                self.message = "Generación completada"
                self.zip_path = zip_path
                
                # Calcular total generados contando archivos en el ZIP
                if os.path.exists(zip_path):
                    import zipfile
                    try:
                        with zipfile.ZipFile(zip_path, 'r') as zipf:
                            jpg_files = [name for name in zipf.namelist() 
                                    if name.lower().endswith('.jpg')]
                            self.total_generados = len(jpg_files)
                    except:
                        self.total_generados = "desconocido"
                    
                    file_size = os.path.getsize(zip_path) / (1024 * 1024)
                    self.result = {
                        "zip_path": zip_path,
                        "file_name": os.path.basename(zip_path),
                        "file_size_mb": round(file_size, 2),
                        "download_url": f"/api/acuses-async/download/{self.task_id}",
                        "estadisticas": {
                            "total_generados": self.total_generados,
                            "total_con_errores": self.total_con_errores,
                            "todos_correctos": self.total_con_errores == 0,
                        }
                    }
        
        except InterruptedError:
            # Cancelación solicitada desde update_progress
            self.status = "cancelled"
            self.message = "Cancelada por el usuario"
        except Exception as e:
            if not self.is_cancelled():
                self.status = "failed"
                self.error = str(e)
                self.message = f"Error: {str(e)}"
                import traceback
                traceback.print_exc()
        
        self.end_time = json.dumps(str(datetime.now()))
    
    def _execute_with_fallback(self):
        """Intenta ejecutar sin contexto (fallback) - SIN CAMBIOS"""
        try:
            # Intentar encontrar la aplicación Flask
            import sys
            import os
            
            # 1. Buscar en módulos ya cargados
            for module_name in sys.modules:
                module = sys.modules[module_name]
                if hasattr(module, 'app'):
                    app_obj = getattr(module, 'app')
                    if hasattr(app_obj, 'app_context'):
                        with app_obj.app_context():
                            return self._execute_in_context()
            
            # 2. Buscar en el directorio actual
            current_dir = os.path.dirname(os.path.abspath(__file__))
            parent_dir = os.path.dirname(current_dir)
            
            # Agregar al path si no está
            if parent_dir not in sys.path:
                sys.path.append(parent_dir)
            
            # 3. Intentar importar desde app.py
            try:
                from app import app
                with app.app_context():
                    return self._execute_in_context()
            except ImportError:
                pass
            
            # 4. Intentar desde main
            try:
                import __main__
                if hasattr(__main__, 'app'):
                    with __main__.app.app_context():
                        return self._execute_in_context()
            except:
                pass
            
            # 5. Si todo falla, crear app temporal mínima
            from flask import Flask
            temp_app = Flask(__name__)
            
            # Copiar configuraciones básicas si existen
            try:
                if 'current_app' in globals():
                    temp_app.config.update(current_app.config)
            except:
                pass
            
            with temp_app.app_context():
                return self._execute_in_context()
                
        except Exception as e:
            raise RuntimeError(f"No se pudo establecer contexto Flask: {str(e)}")
    
    def get_info(self):
        info = {
            "task_id": self.task_id,
            "lote": self.lote,
            "nroCliente": self.nroCliente,
            "status": self.status,
            "progress": self.progress,
            "message": self.message,
            "error": self.error,
            "result": self.result,
            "start_time": self.start_time,
            "end_time": self.end_time
        }
        
        if hasattr(self, 'total_generados'):
            info["total_generados"] = self.total_generados
            info["total_con_errores"] = getattr(self, 'total_con_errores', 0)
        
        return info
    
@acuses_async.route('/api/acuses-async/can-generate', methods=['GET'])
def can_generate():
    """
    Verifica si se puede iniciar una nueva generación
    """
    return jsonify({
        "success": True,
        "can_generate": not generation_in_progress,
        "generation_in_progress": generation_in_progress,
        "current_task_id": current_task_id
    })

@acuses_async.route('/api/acuses-async/generate', methods=['POST'])
def generate_async():
    """
    Inicia generación asíncrona de acuses 
    """
    global generation_in_progress, current_task_id
    
    try:
        if generation_in_progress:
            return jsonify({
                "success": False,
                "error": "Ya hay una generación de acuses en curso. Espere a que termine."
            }), 423  
        
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "Se requiere JSON en el cuerpo"
            }), 400
        
        lote = data.get('lote')
        nroCliente = data.get('nroCliente')
        
        if not lote and not nroCliente:
            return jsonify({
                "success": False,
                "error": "Se requiere 'lote' o 'nroCliente'"
            }), 400
        
        generation_in_progress = True
        task_id = str(uuid.uuid4())
        current_task_id = task_id
        
        print(f"🔐 [LOCK] Iniciando generación {task_id}. Bloqueado: {generation_in_progress}")
        
        flask_context = current_app.app_context
        
        task = AsyncTask(
            task_id=task_id, 
            lote=lote, 
            nroCliente=nroCliente,
            flask_context=flask_context
        )
        tasks[task_id] = task
        
        return jsonify({
            "success": True,
            "task_id": task_id,
            "message": "Generación iniciada en segundo plano",
            "status_url": f"/api/acuses-async/status/{task_id}",
            "download_url": f"/api/acuses-async/download/{task_id}"
        }), 202
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        
        generation_in_progress = False
        current_task_id = None
        
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@acuses_async.route('/api/acuses-async/status/<task_id>', methods=['GET'])
def get_status(task_id):
    
    task = tasks.get(task_id)
    
    if not task:
        return jsonify({
            "success": False,
            "status": "expired",
            "message": "Tarea no encontrada o ya finalizada",
            "final": True
        }), 200
    
    info = task.get_info()
    info["final"] = task.status in ["completed", "failed", "cancelled"]
        
    return jsonify({"success": True, **info})

@acuses_async.route('/api/acuses-async/download/<task_id>', methods=['GET'])
def download_result(task_id):
    """
    Descarga el ZIP generado
    """
    task = tasks.get(task_id)
    
    if not task:
        return jsonify({
            "success": False,
            "error": "Tarea no encontrada"
        }), 404
    
    if task.status != "completed":
        return jsonify({
            "success": False,
            "error": "La generación no está completada",
            "status": task.status
        }), 400
    
    if not task.zip_path or not os.path.exists(task.zip_path):
        return jsonify({
            "success": False,
            "error": "Archivo no encontrado"
        }), 404
    
    try:
        return send_file(
            task.zip_path,
            as_attachment=True,
            download_name=os.path.basename(task.zip_path),
            mimetype='application/zip'
        )
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error al descargar: {str(e)}"
        }), 500

@acuses_async.route('/api/acuses-async/cancel/<task_id>', methods=['POST'])
def cancel_task(task_id):
    
    task = tasks.get(task_id)
    
    if not task:
        return jsonify({
            "success": False,
            "error": "Tarea no encontrada"
        }), 404
        
    if task.status not in ["pending", "processing"]:
        return jsonify({
            "success": False,
            "error": f"No se puede cancelar una tarea en estado: {task.status}"
        }), 400
    
    if task.cancel():
        return jsonify({
            "success": True,
            "message": "Tarea cancelada"
        })
    else:
        return jsonify({
            "success": False,
            "error": "No se pudo cancelar la tarea"
        }), 400


@acuses_async.route('/api/acuses-async/cleanup', methods=['POST'])
def cleanup_tasks():
    """
    Limpia tareas antiguas completadas
    """
    try:
        from datetime import datetime, timedelta
        
        removed = 0
        task_ids_to_remove = []
        
        for task_id, task in tasks.items():
            # Eliminar tareas completadas hace más de 1 hora
            if task.status in ["completed", "failed", "cancelled"]:
                if task.end_time:
                    try:
                        end_time = datetime.fromisoformat(json.loads(task.end_time))
                        if datetime.now() - end_time > timedelta(hours=1):
                            # Limpiar archivos temporales
                            if task.zip_path and os.path.exists(task.zip_path):
                                try:
                                    os.remove(task.zip_path)
                                    # También limpiar directorio temporal
                                    zip_dir = os.path.dirname(task.zip_path)
                                    if zip_dir and os.path.exists(zip_dir):
                                        import shutil
                                        shutil.rmtree(zip_dir, ignore_errors=True)
                                except:
                                    pass
                            task_ids_to_remove.append(task_id)
                    except:
                        task_ids_to_remove.append(task_id)
        
        # Eliminar tareas
        for task_id in task_ids_to_remove:
            tasks.pop(task_id, None)
            removed += 1
        
        return jsonify({
            "success": True,
            "message": f"Se limpiaron {removed} tareas antiguas",
            "remaining_tasks": len(tasks)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@acuses_async.route('/api/acuses-async/active-tasks', methods=['GET'])
def get_active_tasks():
    """
    Obtiene lista de tareas activas
    """
    active_tasks = []
    
    for task_id, task in tasks.items():
        if task.status in ["pending", "processing"]:
            active_tasks.append({
                "task_id": task_id,
                "lote": task.lote,
                "status": task.status,
                "progress": task.progress,
                "message": task.message
            })
    
    return jsonify({
        "success": True,
        "active_tasks": active_tasks,
        "total_tasks": len(tasks)
    })