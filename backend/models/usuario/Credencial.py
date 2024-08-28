from db.serverPostgres import db

class Credencial(db.Model):
    __tablename__ = 'credencial'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nomUsuario = db.Column(db.String(45))
    contrasenia = db.Column(db.String(255))