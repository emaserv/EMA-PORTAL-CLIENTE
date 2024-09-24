from services.emision.adaptersArchivoSegunFormato.AdapterEMASERVICIOS import AdapterEMASERVICIOS
from services.emision.adaptersArchivoSegunFormato.AdapterPSM import AdapterPSM
from services.emision.adaptersArchivoSegunFormato.AdapterDAI import AdapterDAI

def getAdapterByFormat(idFormato):

    if idFormato == 1:
        adapterADevolver = AdapterPSM
    elif idFormato == 2:
        adapterADevolver = AdapterEMASERVICIOS

    #ESTO ES SOLO POR UNA EMERGENCIA
    elif idFormato == 3:
        adapterADevolver = AdapterDAI

    return adapterADevolver