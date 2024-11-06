from db.serverPostgres import db

class Dai(db.Model):    
    __tablename__ = 'dai'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    idGrupoCliente = db.Column(db.Integer, db.ForeignKey('grupoCliente.id'))
    legajoDist = db.Column(db.Text)
    fecha = db.Column(db.Text)
    hora = db.Column(db.Text)
    latitud = db.Column(db.Text)
    longitud = db.Column(db.Text)
    descEstado = db.Column(db.Text)
    pushpin = db.Column(db.Text)
    velocidad = db.Column(db.Text)
    altitud = db.Column(db.Text)
    odometro = db.Column(db.Text)
    distReportada = db.Column(db.Text)
    direccion = db.Column(db.Text)
    zonaGeo = db.Column(db.Text)
    mensConductor = db.Column(db.Text)