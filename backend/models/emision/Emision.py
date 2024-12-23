from db.serverPostgres import db
from sqlalchemy.orm import relationship

class Emision(db.Model):
    __tablename__ = 'emision'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.Text)
    

    itemsEmision = relationship("ItemEmision", backref="emision", foreign_keys="[ItemEmision.idEmision]", cascade="all, delete-orphan")