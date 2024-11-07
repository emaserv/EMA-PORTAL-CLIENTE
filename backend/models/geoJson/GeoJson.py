from db.serverPostgres import db

class GeoJson(db.Model):    
    __tablename__ = 'geoJson'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    geoData = db.Column(db.LargeBinary)  # LargeBinary maps to BYTEA in PostgreSQL
    nombre = db.Column(db.Text)
