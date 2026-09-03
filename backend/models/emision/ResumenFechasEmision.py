from db.serverPostgres import db


class ResumenFechasEmision(db.Model):
    """
    Resumen de combinaciones (idGrupoCliente, fechaEmision) existentes en itemEmision.
    Se mantiene actualizada en cada importacion para que /api/emisiones no tenga
    que escanear itemEmision completa solo para llenar un desplegable.
    """
    __tablename__ = 'resumenFechasEmision'
    __table_args__ = (
        db.UniqueConstraint('idGrupoCliente', 'fechaEmision', name='uq_resumen_fechas_emision'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    idGrupoCliente = db.Column(db.Integer, nullable=False)
    fechaEmision = db.Column(db.Text, nullable=False)
