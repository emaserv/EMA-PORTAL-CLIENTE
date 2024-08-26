from flask import request, jsonify
from db import masterRepo

class RestGenerica:
    
    rutaInicial = '/rest/'

    def __init__(self, claseABuscar, blueprint, adapterLectorJson):
        self.claseABuscar = claseABuscar
        self.blueprint = blueprint
        self.adapterLectorJson = adapterLectorJson
        self.registerURL()

    def getClassName(self):
        nameUpper = self.claseABuscar.__name__

        className = nameUpper[0].lower() + nameUpper[1:]
        return className

    def registerURL(self):
        self.blueprint.add_url_rule(self.rutaInicial + self.getClassName(), 'getAll', self.getAll, methods=['GET'])
        self.blueprint.add_url_rule(self.rutaInicial + self.getClassName() + '/<int:id>', 'getById', self.getById, methods=['GET'])
        self.blueprint.add_url_rule(self.rutaInicial + self.getClassName(), 'create', self.create, methods=['POST'])
        self.blueprint.add_url_rule(self.rutaInicial + self.getClassName() + '/<int:id>', 'update', self.update, methods=['PUT'])
        self.blueprint.add_url_rule(self.rutaInicial + self.getClassName() + '/<int:id>', 'delete', self.delete, methods=['DELETE'])

    def getAll(self):
        try:
            allInstances = masterRepo.getAll(self.claseABuscar)
            allInstancesJson = []
            for obj in allInstances:
                allInstancesJson.append(self.adapterLectorJson.convertQueryToJson(obj))

            return self.createReactJson('Recursos encontrados con exito', allInstancesJson), 200
        except Exception as e:
                return {'error': str(e)}, 500
    
    def getById(self, id):
        try:
            objQuery = masterRepo.getById(self.claseABuscar, id)

            if objQuery is None:
                return '{"message": "Recurso no encontrado"}', 204

            objJson = self.adapterLectorJson.convertQueryToJson(objQuery)
            
            return self.createReactJson('Recurso encontrado', objJson), 200
        except Exception as e:
                return {'error': str(e)}, 500

    def create(self):
        try:
            data_dict = request.json
            
            user = self.adapterLectorJson.convertJsonToObj(data_dict)
            masterRepo.save(user)
            return '{"message": "Recurso creado con exito"}', 201
        except Exception as e:
            return {'error': str(e)}, 500
    
    def update(self, id):
        try:
            obj = masterRepo.getById(self.claseABuscar, id)
            if obj is None:
                return '{"message": "Recurso no encontrado"}', 204

            data_dict = request.json
            masterRepo.update(self.claseABuscar, data_dict, id)

            return '{"message": "Actualizado con exito"}', 200
        except Exception as e:
            return {'error': str(e)}, 500

    def delete(self, id):
        try:
            obj = masterRepo.getById(self.claseABuscar, id)
            if obj is None:
                return '{"message": "Recurso no encontrado"}', 204
            
            masterRepo.delete(self.claseABuscar, id)

            return '{"message": "Borrado con exito"}', 200
        except Exception as e:
            return {'error': str(e)}, 500

    def createReactJson(self, message, data):
        print(data)
        # Medio feito esto pero cualquier otra version me parecia medio overkill
        if isinstance(data, list) and data:
            columns = list(data[0].keys())
            className = 'multiples' + self.claseABuscar.__name__
        elif isinstance(data, dict):
            columns = list(data.keys())
            className = self.getClassName()
        
        return jsonify({"message": message, "columns": columns, className: data})