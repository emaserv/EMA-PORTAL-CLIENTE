from models.emision.Emision import Emision
from datetime import datetime

def leerEmision(filename):
    
    emision = Emision(
        nombre = filename
    ) 

    return emision

def getCurrentDate():
    return datetime.now().strftime("%Y-%m-%d")