from flask import Flask
from flask_cors import CORS
from flask import Blueprint
from db.serverMysql import db

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

from models.cliente.GrupoCliente import GrupoCliente
from models.emision.Emision import Emision
from models.emision.ItemEmision import ItemEmision
from models.usuario.Usuario import Usuario
from models.usuario.Usuario import Credenciales

# Imports de blueprints de los modulos del sistema
from routes.master import master
from routes.planificacion import planificacion
from routes.appMobile import appMobile
from routes.estadoRecorrido import estadoRecorrido
from routes.RestGenerica import RestGenerica
from routes.mantenedorClientes import mantClientes
from routes.rolUsuario import rolUsuario
from routes.lecturaImagenes import lectorImagen
from routes.mantenedorRecorrido import mantRecorridos
from routes.mantenedorTipoServicio import mantTipoServicios
from routes.seguimiento import seguimiento
from routes.usuarioFormatoWeb import usuarioFormatoWeb

# Regstro de blueprints de los modulos del sistema
app.register_blueprint(master)
app.register_blueprint(importador)
app.register_blueprint(planificacion)
app.register_blueprint(estadoRecorrido)
app.register_blueprint(appMobile)
app.register_blueprint(mantClientes)
app.register_blueprint(mantRecorridos)
app.register_blueprint(mantTipoServicios)
app.register_blueprint(rolUsuario)
app.register_blueprint(lectorImagen)
app.register_blueprint(seguimiento)
app.register_blueprint(usuarioFormatoWeb)

# Import de los adapters para la rest generica
from services.adaptersRest.AdapterUsuario import AdapterUsuario
from services.adaptersRest.AdapterRecorridoHist import AdapterRecorridoHist
from services.adaptersRest.AdapterLote import AdapterLote 
from services.adaptersRest.AdapterGrupoCliente import AdapterGrupoCliente
from services.adaptersRest.AdapterRecorridoAsignado import AdapterRecorridoAsignado
from services.adaptersRest.AdapterTipoRecorrido import AdapterTipoRecorrido
from services.adaptersRest.AdapterZonaOperativa import AdapterZonaOperativa
from services.adaptersRest.AdapterCatServicioCliente import AdapterCatServicioCliente
from services.adaptersRest.AdapterClienteBtoB import AdapterClienteBtoB
from services.adaptersRest.AdapterItemRecorrido import AdapterItemRecorrido
from routes.UserRest import UserRest

# Instanciando los blueprints de las controladoras rest
UsuarioRestBluePrint = Blueprint('UserRest', __name__)
RecorridoRestBluePrint = Blueprint('RecorridoHistRest', __name__)
LoteBlueprint = Blueprint('LoteRest', __name__)
GrupoClienteBluePrint = Blueprint('GrupoClienteRest', __name__)
RecorridoAsignadoBluePrint = Blueprint('RecorridoAsignadoRest', __name__)
TipoRecorridoRestBluePrint = Blueprint('TipoRecorridoRest', __name__)
ZonaOperativaRestBluePrint = Blueprint('ZonaOperativaRest', __name__)
CatServicioClienteBluePrint = Blueprint('CatServicioClienteRest', __name__)
ClienteBtoBBluePrint = Blueprint('ClienteBtoBRest', __name__)
ItemRecorridoBluePrint = Blueprint('ItemRecorridoRest', __name__)

# Instanciando las controladoras rest
userRest = UserRest(Usuario, UsuarioRestBluePrint, AdapterUsuario)
recorridoHistRest = RestGenerica(RecorridoHistorico, RecorridoRestBluePrint, AdapterRecorridoHist)
loteRest = RestGenerica(Lote, LoteBlueprint, AdapterLote)
grupoClienteRest = RestGenerica(GrupoCliente, GrupoClienteBluePrint, AdapterGrupoCliente)
recorridoAsignadoRest = RestGenerica(RecorridoAsignado, RecorridoAsignadoBluePrint, AdapterRecorridoAsignado)
tipoRecorridoRest = RestGenerica(TipoRecorrido, TipoRecorridoRestBluePrint, AdapterTipoRecorrido)
zonaOperativaRest = RestGenerica(ZonaOperativa, ZonaOperativaRestBluePrint, AdapterZonaOperativa)
catServicioClienteRest = RestGenerica(CatServicioCliente, CatServicioClienteBluePrint, AdapterCatServicioCliente)
clienteBtoBRest = RestGenerica(ClienteBtoB, ClienteBtoBBluePrint, AdapterClienteBtoB)
itemRecorridoRest = RestGenerica(ItemRecorrido, ItemRecorridoBluePrint, AdapterItemRecorrido)

# Registro de blueprints de controlers rest
app.register_blueprint(UsuarioRestBluePrint)
app.register_blueprint(RecorridoRestBluePrint)
app.register_blueprint(LoteBlueprint)
app.register_blueprint(GrupoClienteBluePrint)
app.register_blueprint(RecorridoAsignadoBluePrint)
app.register_blueprint(TipoRecorridoRestBluePrint)
app.register_blueprint(ZonaOperativaRestBluePrint)
app.register_blueprint(CatServicioClienteBluePrint)
app.register_blueprint(ClienteBtoBBluePrint)
app.register_blueprint(ItemRecorridoBluePrint)

#Esto es para que se creen las tablas. NO TOCAR!
from models.cliente import ClienteBtoB, GrupoCliente, ClienteBtoC, CatServicioCliente
from models.lote import ItemLote, Lote, TipoServicio
from models.recorrido import RecorridoAsignado, TipoRecorrido, Ubicacion, RecorridoHistorico, ItemRecorrido
from models.usuario import ZonaOperativa, Credenciales, Usuario, Presentismo

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Conexión a la base de datos exitosa")
    
    app.run(host='0.0.0.0', port=80)