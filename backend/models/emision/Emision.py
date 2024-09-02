from db.serverPostgres import db

class Emision(db.Model):
    __tablename__ = 'emision'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.Text)
