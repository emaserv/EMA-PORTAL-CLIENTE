from flask import Flask
from flask_cors import CORS
from flask import Blueprint
from db.serverPostgres import db

import os
import varEntorno 

app = Flask(__name__)
CORS(app)

try:
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("URL_DB")
    db.init_app(app)
except Exception as e:
    print(f"Error al conectar a la base de datos: {str(e)}")
    
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')

from models.usuario.Usuario import Usuario
from models.cliente.GrupoCliente import GrupoCliente

from routes.RestGenerica import RestGenerica
from routes.auth import auth

app.register_blueprint(auth)

from services.adaptersRest.AdapterUsuario import AdapterUsuario
from services.adaptersRest.AdapterGrupoCliente import AdapterGrupoCliente

UsuarioRestBluePrint = Blueprint('UserRest', __name__)
GrupoClienteBluePrint = Blueprint('GrupoClienteRest', __name__)

userRest = RestGenerica(Usuario, UsuarioRestBluePrint, AdapterUsuario)
grupoClienteRest = RestGenerica(GrupoCliente, GrupoClienteBluePrint, AdapterGrupoCliente)

app.register_blueprint(UsuarioRestBluePrint)
app.register_blueprint(GrupoClienteBluePrint)

#Esto es para que se creen las tablas. NO TOCAR!
from models.cliente import GrupoCliente
from models.emision import Emision, ItemEmision
from models.usuario import Credencial, Usuario

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Conexión a la base de datos exitosa")
    
    app.run(host='0.0.0.0', port=80)