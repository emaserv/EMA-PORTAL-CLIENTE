from services.emision.adaptersEmisionSegunFormato.AdapterEMASERVICIOS import AdapterEMASERVICIOS
from services.emision.adaptersEmisionSegunFormato.AdapterPSM import AdapterPSM

def getAdapterByFormat(idFormato):
        
    if idFormato == 1:
        adapterADevolver = AdapterPSM
    elif idFormato == 2:
        adapterADevolver = AdapterEMASERVICIOS

    return adapterADevolver