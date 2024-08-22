from db.serverMysql import db

class Credencial(db.Model):
    __tablename__ = 'credencial'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(45))
    id_grupo_cliente = db.Column(db.Integer, db.ForeignKey('grupo_cliente.id'))