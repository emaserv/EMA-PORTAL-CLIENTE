from db.serverMysql import db

class Emision(db.Model):
    __tablename__ = 'emision'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.Text)
    id_grupo_cliente = db.Column(db.Integer, db.ForeignKey('grupo_cliente.id'))
