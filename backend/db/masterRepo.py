from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from flask import current_app

class DatabaseSession:
    _instance = None

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(DatabaseSession, cls).__new__(cls)
            cls._instance.engine = create_engine(current_app.config['SQLALCHEMY_DATABASE_URI'])
            cls._instance.Session = sessionmaker(bind=cls._instance.engine)
        return cls._instance

    def get_session(self):
        return self.Session()

def getAll(classToFind):
    session = DatabaseSession()._instance.get_session()
    allInstances = session.query(classToFind).order_by(classToFind.id).all()
    session.close()
    return allInstances

def getById(classToFind, idNum):
    session = DatabaseSession()._instance.get_session()
    instanceToFind = session.query(classToFind).get(idNum)
    session.close()
    return instanceToFind

def save(instance):
    session = DatabaseSession()._instance.get_session()
    session.add(instance)
    session.commit()
    session.close()
    return

def update(classToFind, instanceToUpdateJson, id):
    session = DatabaseSession()._instance.get_session()
    session.query(classToFind).filter(classToFind.id == id).update(instanceToUpdateJson)
    session.commit()
    session.close()

def delete(classToFind, id):
    session = DatabaseSession()._instance.get_session()
    session.query(classToFind).filter(classToFind.id == id).delete()
    session.commit()
    session.close()