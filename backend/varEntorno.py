import os
import urllib.parse

password = 'psm12345*'  # Tu contraseña con caracteres especiales
encoded_password = urllib.parse.quote(password, safe="")  # Codifica caracteres especiales

os.environ['URL_DB'] = f'postgresql://postgres:{encoded_password}@192.168.10.57:5432/portalClientes'


