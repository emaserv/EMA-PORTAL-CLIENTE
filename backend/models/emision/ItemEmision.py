from db.serverPostgres import db

class ItemEmision(db.Model):    
    __tablename__ = 'itemEmision'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nro_cliente = db.Column(db.Integer)
    titular = db.Column(db.Integer)
    calle = db.Column(db.Integer)
    altura = db.Column(db.Integer)
    idEmision = db.Column(db.Integer, db.ForeignKey('emision.id'))
    sucursal = db.Column(db.Integer)
    planTurno = db.Column(db.Integer)
    radio = db.Column(db.Integer)
    ruta = db.Column(db.Integer)
    distribuidor = db.Column(db.String(255))
    estadoPieza = db.Column(db.String(50))
    obsInterna = db.Column(db.String(255))
    obsVisita = db.Column(db.String(255))
    fechaDistrib = db.Column(db.Date)
    horaDistrib = db.Column(db.Time)
    geoCliente = db.Column(db.String(255))
    geoVisita = db.Column(db.String(255))
    foto = db.Column(db.String(255))