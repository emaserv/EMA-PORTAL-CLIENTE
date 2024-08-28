from models.lote.Lote import Lote
from datetime import datetime

def leerLote(data_dict, filename):
    nombreLoteDeForm = data_dict.get('nombreLote')
    idtipoServicioDeForm = data_dict.get('tipoServicio')
    fechaEmisionDeForm = data_dict.get('fechaEmision')
    idgrupo_clienteNew = data_dict.get('idgrupo_cliente')
    
    lote = Lote(
        idgrupo_cliente = idgrupo_clienteNew,
        idTipoDeServicio = idtipoServicioDeForm,
        nombreLote = nombreLoteDeForm,
        nombreArchivo = filename,
        fechaIngreso = getCurrentDate(),
        # fechaContable = # Preguntarle a guille,
        fechaEmision = fechaEmisionDeForm
    ) 

    return lote



def getCurrentDate():
    return datetime.now().strftime("%Y-%m-%d")