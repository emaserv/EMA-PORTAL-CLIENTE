from db.serverPostgres import db

class GrupoCliente(db.Model):
    __tablename__ = 'grupoCliente'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100))
