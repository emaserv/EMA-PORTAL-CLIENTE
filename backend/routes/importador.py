import os
import pandas as pd
import json
from flask import Blueprint, jsonify, request, current_app, json
from services.emision import factoryAdapterArchivo
from services.emision import adapterEmisionCSV
from sqlalchemy.sql import text
from db.masterRepo import DatabaseSession
from models.geoJson.GeoJson import GeoJson

importador = Blueprint('importador', __name__)

def get_column_names(model):
    return [column.name for column in model.__table__.columns]

@importador.route('/api/upload', methods=['POST'])
def uploadFileAndData():
    if not os.path.exists(current_app.config['UPLOAD_FOLDER']):
        os.makedirs(current_app.config['UPLOAD_FOLDER'])

    if 'file' not in request.files:
        return {'error': 'No file part'}, 400

    file = request.files['file']
    if file.filename == '':
        return {'error': 'No selected file'}, 400

    json_data = request.form.get('data')
    if not json_data:
        return jsonify({'error': 'No JSON data part'}), 400

    try:
        data_dict = json.loads(json_data) 
        if data_dict.get('idFormato') == 4:
            # Se recibe un json
            file_content = file.read()
            data = json.loads(file_content)
        else:
            data = XSLXtoJSONconverter(file, data_dict.get('idFormato'))

        JSONsaver(file, data)

        with DatabaseSession().get_session() as session:
            if data_dict.get('idFormato') == 1 or data_dict.get('idFormato') == 2:
                emision = adapterEmisionCSV.leerEmision(file.filename)   
                
                adapterLeerExcel = factoryAdapterArchivo.getAdapterByFormat(data_dict.get('idFormato'))
                print(adapterLeerExcel)

                print("pase x aca 1")
                print(data)

                for entry in data:
                    print("pase x aca 2")   
                    print(entry)

                    itemEmision = adapterLeerExcel.leerItemEmision(entry, emision.id)

                    print(itemEmision)
                    print("pase x aca 4")

                    if itemEmision:
                        emision.itemsEmision.append(itemEmision)
                        print("pase x aca 5")

                session.add(emision)
                session.commit()
            
            elif data_dict.get('idFormato') == 3:                
                adapterLeerExcel = factoryAdapterArchivo.getAdapterByFormat(data_dict.get('idFormato'))
                print(adapterLeerExcel)

                print("pase x aca 1")
                print(data)

                for entry in data:
                    print("pase x aca 2")   
                    print(entry)

                    dai = adapterLeerExcel.leerDAI(entry)

                    print(dai)
                    print("pase x aca 4")

                    session.add(dai)    
                    session.commit()
            
            elif data_dict.get('idFormato') == 4:                

                print("pase por geoJson")
                print(data)
                json_data = json.dumps(data)
                encoded_data = json_data.encode('utf-8')

                geoJson = GeoJson (
                    geoData=encoded_data
                )

                session.add(geoJson)    
                session.commit()
            

        return {'message': 'File uploaded and converted to JSON successfully'}, 200
    except Exception as e:
        if 'lote' in locals():
            session.rollback()
        return {'error': str(e)}, 500


def XSLXtoJSONconverter(file, idFormato):
    # Convierte el archivo Excel directamente a un objeto JSON

    #si es de emaservicios, lo que hago es skippear la primer linea
   # if idFormato == 2:
   #     excel_data = pd.read_excel(file, skiprows=1)
   # else:
    excel_data = pd.read_excel(file)

    data_json = excel_data.to_json(orient="records", date_format='iso')
    data = json.loads(data_json)

    return data

def JSONsaver(file, data):
    # Esto es para que el nombre del JSON que se genera tenga el mismo nombre que el 
    # excel que subimos
    fileNameOG = file.filename
    extension = fileNameOG.split('.')[-1].lower()
    newFileName = fileNameOG.replace(extension, "json")

    # Guarda el JSON en el server
    json_filename = os.path.join(current_app.config['UPLOAD_FOLDER'], newFileName)
    with open(json_filename, 'w', encoding='utf-8') as json_file:
        json_file.write(json.dumps(data, indent=4, ensure_ascii=False))
    

