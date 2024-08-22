from db.serverMysql import db

class Usuario(db.Model):
    __tablename__ = 'usuario'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(45))
    apellido = db.Column(db.String(45))
    id_grupo_cliente = db.Column(db.Integer, db.ForeignKey('grupo_cliente.id'))
    id_credencial = db.Column(db.Integer, db.ForeignKey('credencial.id'))