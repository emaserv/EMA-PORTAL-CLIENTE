from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from db.serverPostgres import db
import os
import secrets
import varEntorno

app = Flask(__name__)

FRONTEND_ORIGIN = os.environ.get('FRONTEND_ORIGIN', 'http://localhost:3001')
CORS(app, supports_credentials=True, origins=[FRONTEND_ORIGIN])

jwt_secret_key = os.environ.get('JWT_SECRET_KEY')
if not jwt_secret_key:
    jwt_secret_key = secrets.token_hex(32)
    print("ADVERTENCIA: JWT_SECRET_KEY no esta definida en el entorno. "
          "Se genero una clave temporal para esta ejecucion: todas las "
          "sesiones se invalidaran al reiniciar el servidor. "
          "Definir JWT_SECRET_KEY como variable de entorno real en produccion.")

app.config['JWT_SECRET_KEY'] = jwt_secret_key
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = os.environ.get('JWT_COOKIE_SECURE', 'False').lower() == 'true'
app.config['JWT_COOKIE_SAMESITE'] = os.environ.get('JWT_COOKIE_SAMESITE', 'Lax')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=8)
app.config['JWT_COOKIE_CSRF_PROTECT'] = True
app.config['JWT_CSRF_METHODS'] = ['POST', 'PUT', 'PATCH', 'DELETE']
jwt = JWTManager(app)

try:
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("URL_DB")
    db.init_app(app)
except Exception as e:
    print(f"Error al conectar a la base de datos: {str(e)}")
    
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200 MB

from routes.auth import auth
from routes.fechaCliente import fechaCliente
from routes.radioCliente import radioCliente
from routes.importador import importador
from routes.geoJson import geoJson
from routes.acuses import acuses
from routes.acuses_async import acuses_async
from routes.usuarios import usuarios

app.register_blueprint(auth)
app.register_blueprint(fechaCliente)
app.register_blueprint(radioCliente)
app.register_blueprint(importador)
app.register_blueprint(geoJson)
app.register_blueprint(acuses)
app.register_blueprint(acuses_async)
app.register_blueprint(usuarios)

# Nota: antes aca se exponia un CRUD generico (RestGenerica) para Usuario y
# GrupoCliente protegido solo con @jwt_required(), sin scoping por
# idGrupoCliente ni por rol. Cualquier usuario autenticado podia listar,
# editar o borrar usuarios de OTROS clientes. Se reemplazo por las rutas
# admin-only de routes/usuarios.py.

#Esto es para que se creen las tablas. NO TOCAR!
from models.cliente import GrupoCliente
from models.emision import Emision, ItemEmision
from models.usuario import Credencial, Usuario
from models.dai import Dai

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de verificación de salud"""
    from datetime import datetime
    return {
        "status": "healthy",
        "service": "acuses-optimizado",
        "timestamp": datetime.now().isoformat(),
        "directorios": {
            "temporales": "Usa tempfile.mkdtemp() - no necesita directorio fijo"
        },
        "endpoints": {
            "async_generate": "/api/acuses-async/generate",
            "async_status": "/api/acuses-async/status/<task_id>",
            "async_download": "/api/acuses-async/download/<task_id>"
        }
    }

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Conexión a la base de datos exitosa")
    
    app.run(host='0.0.0.0', port=5000)