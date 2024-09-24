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