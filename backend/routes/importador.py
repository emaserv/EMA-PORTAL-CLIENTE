import os
import pandas as pd
import json
from flask import Blueprint, jsonify, request, current_app, json
from services.emision import adapterEmisionCSV, factoryAdapterEmision
from sqlalchemy.sql import text
from db.masterRepo import DatabaseSession


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
        data = XSLXtoJSONconverter(file)

        JSONsaver(file, data)

        with DatabaseSession().get_session() as session:
            emision = adapterEmisionCSV.leerEmision(file.filename)   
            
            adapterLeerExcel = factoryAdapterEmision.getAdapterByFormat(data_dict.get('idFormato'))
            print(adapterLeerExcel)

            print("pase x aca 1")
            print(data)

            for entry in data:
                print("pase x aca 2")   
                print(entry)

                itemEmision = adapterLeerExcel.leerItemEmision(entry, emision.id)

                print(itemEmision)
                print("pase x aca 4")

                emision.itemsEmision.append(itemEmision)
                print("pase x aca 5")

            session.add(emision)
            session.commit()

        return {'message': 'File uploaded and converted to JSON successfully'}, 200
    except Exception as e:
        if 'lote' in locals():
            session.rollback()
        return {'error': str(e)}, 500


def XSLXtoJSONconverter(file):
    # Convierte el archivo Excel directamente a un objeto JSON
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
    

