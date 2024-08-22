from db.serverMysql import db

class ItemEmision(db.Model):    
    __tablename__ = 'item_emision'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nro_cliente = db.Column(db.Integer)
    titular = db.Column(db.Integer)
    calle = db.Column(db.Integer)
    altura = db.Column(db.Integer)
    id_emision = db.Column(db.Integer, db.ForeignKey('emision.id'))
    sucursal = db.Column(db.Integer)
    plan_turno = db.Column(db.Integer)
    radio = db.Column(db.Integer)
    ruta = db.Column(db.Integer)
    distribuidor = db.Column(db.String(255))
    estado_pieza = db.Column(db.String(50))
    obs_interna = db.Column(db.String(255))
    obs_visita = db.Column(db.String(255))
    fecha_distribucion = db.Column(db.Date)
    hora_distribucion = db.Column(db.Time)
    geo_cliente = db.Column(db.String(255))
    geo_visita = db.Column(db.String(255))
    foto = db.Column(db.String(255))