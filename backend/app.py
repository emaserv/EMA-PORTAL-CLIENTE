from flask import Flask
from flask_cors import CORS
from flask import Blueprint
#from flask_jwt_extended import JWTManager
from db.serverPostgres import db

import os
import varEntorno 

app = Flask(__name__)
#jwt = JWTManager(app)
CORS(app)

try:
    #app.config['JWT_SECRET_KEY'] = 'prueba1'
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("URL_DB")
    db.init_app(app)
except Exception as e:
    print(f"Error al conectar a la base de datos: {str(e)}")
    
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200 MB

from models.usuario.Usuario import Usuario
from models.cliente.GrupoCliente import GrupoCliente
from models.emision.Emision import Emision

from routes.RestGenerica import RestGenerica
from routes.auth import auth
from routes.fechaCliente import fechaCliente
from routes.radioCliente import radioCliente
from routes.importador import importador
from routes.geoJson import geoJson
from routes.acuses import acuses

app.register_blueprint(auth)
app.register_blueprint(fechaCliente)
app.register_blueprint(radioCliente)
app.register_blueprint(importador)
app.register_blueprint(geoJson)
app.register_blueprint(acuses)

from services.adaptersRest.AdapterUsuario import AdapterUsuario
from services.adaptersRest.AdapterGrupoCliente import AdapterGrupoCliente
from services.adaptersRest.AdapterEmision import AdapterEmision

UsuarioRestBluePrint = Blueprint('UserRest', __name__)
GrupoClienteBluePrint = Blueprint('GrupoClienteRest', __name__)
EmisionBluePrint = Blueprint('EmisionRest', __name__)

userRest = RestGenerica(Usuario, UsuarioRestBluePrint, AdapterUsuario)
grupoClienteRest = RestGenerica(GrupoCliente, GrupoClienteBluePrint, AdapterGrupoCliente)
emisionRest = RestGenerica(Emision, EmisionBluePrint, AdapterEmision)

app.register_blueprint(UsuarioRestBluePrint)
app.register_blueprint(GrupoClienteBluePrint)
app.register_blueprint(EmisionBluePrint)

#Esto es para que se creen las tablas. NO TOCAR!
from models.cliente import GrupoCliente
from models.emision import Emision, ItemEmision
from models.usuario import Credencial, Usuario
from models.dai import Dai

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Conexión a la base de datos exitosa")
    
    app.run(host='127.0.0.1', port=5000)