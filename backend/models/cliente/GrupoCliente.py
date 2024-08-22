from db.serverMysql import db

class GrupoCliente(db.Model):
    __tablename__ = 'grupo_cliente'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100))
