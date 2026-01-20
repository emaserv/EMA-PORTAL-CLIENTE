"""
Generador de imágenes JPG
CON MANEJO DE IMÁGENES CORRUPTAS 
"""
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import os
import re
from datetime import datetime
import requests
import reportlab
import time

class AcuseImageGenerator:
    """
    Replica exactamente el diseño del componente React AcuseReciboConFirma
    """

    def _load_fonts(self):
        """Cargar fuentes con NEGRITAS para textos específicos"""
        fonts = {}
        
        font_paths = [
            "C:/Windows/Fonts/arialbd.ttf",  
            "C:/Windows/Fonts/arial.ttf",    
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/Arial.ttf",
        ]
        
        # Intentar cargar Arial Bold primero
        arial_bold_path = "C:/Windows/Fonts/arialbd.ttf"
        arial_regular_path = "C:/Windows/Fonts/arial.ttf"
        
        try:
            if os.path.exists(arial_bold_path):
                
                if os.path.exists(arial_regular_path):

                    # Textos en NEGRITA
                    fonts['h6'] = ImageFont.truetype(arial_bold_path, 20)
                    fonts['subtitle1'] = ImageFont.truetype(arial_bold_path, 16)
                    fonts['body1_bold'] = ImageFont.truetype(arial_bold_path, 14)
                    fonts['caption_bold'] = ImageFont.truetype(arial_bold_path, 10)
                    
                    # Textos en REGULAR (no negrita)
                    fonts['body1'] = ImageFont.truetype(arial_regular_path, 14)
                    fonts['body2'] = ImageFont.truetype(arial_regular_path, 12)
                    fonts['caption'] = ImageFont.truetype(arial_regular_path, 10)
                else:
                    # Si no hay Arial Regular, usar Bold para todo
                    fonts['h6'] = ImageFont.truetype(arial_bold_path, 20)
                    fonts['subtitle1'] = ImageFont.truetype(arial_bold_path, 16)
                    fonts['body1_bold'] = ImageFont.truetype(arial_bold_path, 14)
                    fonts['body1'] = ImageFont.truetype(arial_bold_path, 14)
                    fonts['body2'] = ImageFont.truetype(arial_bold_path, 12)
                    fonts['caption'] = ImageFont.truetype(arial_bold_path, 10)
                    fonts['caption_bold'] = ImageFont.truetype(arial_bold_path, 10)
                    
            else:
                default = ImageFont.load_default()
                fonts = {
                    'h6': default,
                    'subtitle1': default,
                    'body1_bold': default,
                    'body1': default,
                    'body2': default,
                    'caption': default,
                    'caption_bold': default
                }
                
        except Exception as e:
            default = ImageFont.load_default()
            fonts = {
                'h6': default,
                'subtitle1': default,
                'body1_bold': default,
                'body1': default,
                'body2': default,
                'caption': default,
                'caption_bold': default
            }
        
        return fonts

    def __init__(self):
        self.image_width = 1000
        self.image_height = 2000  
        
        # Colores exactos del diseño
        self.colors = {
            'background': (255, 255, 255),  # Blanco
            'text': (0, 0, 0),              # Negro
            'header_blue': (33, 82, 255),   # Azul EMA #2152FF
            'light_blue': (208, 234, 244),  # #d0eaf4
            'pale_blue': (240, 248, 251),   # #f0f8fb
            'gray_border': (204, 204, 204), # #ccc
            'light_gray': (248, 248, 248)   # #f8f8f8
        }
        
        # Cargar logos
        self.logos = self._load_logos()
        
        # Cargar fuentes
        self.fonts = self._load_fonts()

    def _download_image_safe(self, image_url, max_width=800, quality=60, timeout=10):
        """
        Descarga y optimiza una imagen directamente SIN CACHE
        """
        if not image_url or not isinstance(image_url, str) or image_url.strip() == "":
            return None
        
        try:
            # Descargar con timeout
            response = requests.get(image_url, timeout=timeout)
            
            if response.status_code != 200:
                return None
            
            content = response.content
            
            # Verificar tamaño mínimo
            if len(content) < 100:
                return None
            
            # Verificar que sea una imagen válida
            try:
                img = Image.open(BytesIO(content))
                img.verify()  # Verifica integridad
            except Exception as img_error:
                print(f"Imagen corrupta en URL: {image_url[:50]}... - {img_error}")
                return None
            
            # Reabrir después de verify()
            img = Image.open(BytesIO(content))
            
            # Redimensionar si es necesario
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Convertir a RGB si es necesario
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Guardar optimizada
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=quality, optimize=True)
            
            result = buffer.getvalue()
            
            # Verificar resultado
            if len(result) < 1000:
                return None
            
            return result
            
        except requests.exceptions.Timeout:
            return None
        except Exception as e:
            return None
    
    def __init__(self):
        self.image_width = 1000
        self.image_height = 2000  
        
        # Colores exactos del diseño
        self.colors = {
            'background': (255, 255, 255),  # Blanco
            'text': (0, 0, 0),              # Negro
            'header_blue': (33, 82, 255),   # Azul EMA #2152FF
            'light_blue': (208, 234, 244),  # #d0eaf4
            'pale_blue': (240, 248, 251),   # #f0f8fb
            'gray_border': (204, 204, 204), # #ccc
            'light_gray': (248, 248, 248)   # #f8f8f8
        }
        
        # Cargar logos
        self.logos = self._load_logos()
        
        # Cargar fuentes
        self.fonts = self._load_fonts()
    
    def _load_logos(self):
        """Cargar logos desde archivos Y REDIMENSIONAR INMEDIATAMENTE"""
        logos = {}
        try:
            logo_paths = {
                'ema': 'static/Logo-ema.png',
                'naturgy': 'static/Naturgy.png'
            }
            
            for key, path in logo_paths.items():
                if os.path.exists(path):
                    try:
                        img = Image.open(path)
                        
                        if img.width > 1000 or img.height > 1000:
                            
                            max_width = 500
                            if img.width > max_width:
                                ratio = max_width / img.width
                                new_height = int(img.height * ratio)
                                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                        
                        logos[key] = img
                        
                    except Exception as e:
                        logos[key] = self._create_logo_placeholder(key.upper())
                else:
                    logos[key] = self._create_logo_placeholder(key.upper())
                    
        except Exception as e:
            logos['ema'] = self._create_logo_placeholder("EMA")
            logos['naturgy'] = self._create_logo_placeholder("NATURGY")
        
        return logos
    
    def _create_logo_placeholder(self, text):
        """Crear logo placeholder"""
        img = Image.new('RGB', (200, 60), (33, 82, 255))
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("arial.ttf", 20) if os.path.exists("arial.ttf") else ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        draw.text((100, 30), text, fill=(255, 255, 255), font=font, anchor="mm")
        return img
    
    def generate_acuse_jpg(self, acuse_data, quality=60):
        """
        Genera JPG que replica EXACTAMENTE el diseño React
        VERSIÓN CORREGIDA
        """
        
        if not acuse_data or not isinstance(acuse_data, dict):
            return self._generate_emergency_acuse({'nroCliente': 'INVALIDO'})
        
        safe_data = self._prepare_safe_data(acuse_data)
        
        try:
            dynamic_height = self._calculate_height(safe_data)
            
            img = Image.new('RGB', (self.image_width, dynamic_height), 
                        self.colors['background'])
            draw = ImageDraw.Draw(img)
            
            y_position = 40

            y_position = self._draw_header(draw, img, safe_data, y_position)
            y_position = self._draw_title_band(draw, safe_data, y_position)
            y_position = self._draw_delivery_data(draw, img, safe_data, y_position)  
            y_position = self._draw_visits_safe(draw, safe_data, y_position + 30)
            y_position = self._draw_additional_data(draw, safe_data, y_position + 20)
            y_position = self._draw_images_safe(draw, img, safe_data, y_position - 30)
            
            img = img.crop((0, 0, self.image_width, y_position + 50))
            
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=quality, optimize=True)
            
            return buffer.getvalue()
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return self._generate_emergency_acuse(safe_data)

    def _prepare_safe_data(self, acuse_data):
        """Prepara datos seguros para renderizado - VERSIÓN DEFINITIVA"""
        safe_data = {}
        
        if isinstance(acuse_data, dict):
            for key, value in acuse_data.items():
                safe_data[key] = value
        else:
            return self._get_default_safe_data()
        
        segunda_visita_value = safe_data.get('segundaVisita')
        
        # Inicializar como dict vacío por defecto
        segunda_visita_dict = {'fecha2': '', 'hora2': ''}
        
        # 1. Si es None o vacío
        if segunda_visita_value is None:
            segunda_visita_dict = {'fecha2': '', 'hora2': ''}
        
        # 2. Si ya es un diccionario (ideal)
        elif isinstance(segunda_visita_value, dict):
            fecha2 = segunda_visita_value.get('fecha2')
            hora2 = segunda_visita_value.get('hora2')
            
            # Convertir cualquier tipo a string seguro
            segunda_visita_dict = {
                'fecha2': str(fecha2).strip() if fecha2 is not None else '',
                'hora2': str(hora2).strip() if hora2 is not None else ''
            }
        
        # 3. Si es string (caso problemático)
        elif isinstance(segunda_visita_value, str):
            str_value = segunda_visita_value.strip()
            
            # Caso 3.1: String vacío o '{}'
            if not str_value or str_value in ['{}', 'null', 'None', '""', "''"]:
                segunda_visita_dict = {'fecha2': '', 'hora2': ''}
            
            # Caso 3.2: JSON válido (comillas dobles)
            elif str_value.startswith('{') and str_value.endswith('}'):
                try:
                    import json
                    parsed = json.loads(str_value)
                    
                    if isinstance(parsed, dict):
                        segunda_visita_dict = {
                            'fecha2': str(parsed.get('fecha2', '')).strip(),
                            'hora2': str(parsed.get('hora2', '')).strip()
                        }
                        
                except json.JSONDecodeError as json_err:
                    
                    # Intentar con ast.literal_eval (para Python dict strings)
                    try:
                        import ast
                        parsed = ast.literal_eval(str_value)
                        
                        if isinstance(parsed, dict):
                            segunda_visita_dict = {
                                'fecha2': str(parsed.get('fecha2', '')).strip(),
                                'hora2': str(parsed.get('hora2', '')).strip()
                            }
                            
                    except (SyntaxError, ValueError) as ast_err:
                        
                        # Último intento: buscar patrones con regex
                        import re
                        fecha2 = ''
                        hora2 = ''
                        
                        # Buscar fecha en formato 2025-12-05
                        fecha_match = re.search(r"'fecha2'\s*:\s*'([^']+)'", str_value)
                        if not fecha_match:
                            fecha_match = re.search(r'"fecha2"\s*:\s*"([^"]+)"', str_value)
                        if fecha_match:
                            fecha2 = fecha_match.group(1).strip()
                        
                        # Buscar hora en formato 09:20:00
                        hora_match = re.search(r"'hora2'\s*:\s*'([^']+)'", str_value)
                        if not hora_match:
                            hora_match = re.search(r'"hora2"\s*:\s*"([^"]+)"', str_value)
                        if hora_match:
                            hora2 = hora_match.group(1).strip()
                        
                        segunda_visita_dict = {'fecha2': fecha2, 'hora2': hora2}
            
        
        # 4. Si es tupla o lista (formato alternativo)
        elif isinstance(segunda_visita_value, (tuple, list)):
            if len(segunda_visita_value) >= 2:
                segunda_visita_dict = {
                    'fecha2': str(segunda_visita_value[0]).strip() if segunda_visita_value[0] is not None else '',
                    'hora2': str(segunda_visita_value[1]).strip() if segunda_visita_value[1] is not None else ''
                }
        
        # 5. Cualquier otro tipo
        else:
            print(f"segundaVisita tipo inesperado: {type(segunda_visita_value)}")
            # Intentar convertir a string y luego buscar patrones
            try:
                str_val = str(segunda_visita_value)
                import re
                # Buscar fecha y hora en el string
                fecha_match = re.search(r'(\d{4}-\d{2}-\d{2})', str_val)
                hora_match = re.search(r'(\d{2}:\d{2}:\d{2})', str_val)
                
                segunda_visita_dict = {
                    'fecha2': fecha_match.group(1) if fecha_match else '',
                    'hora2': hora_match.group(1) if hora_match else ''
                }
            except:
                print(f"ERROR: No se pudo procesar segundaVisita")
        
        # Asignar el resultado procesado
        safe_data['segundaVisita'] = segunda_visita_dict
        
        # Campos obligatorios con valores por defecto
        default_fields = {
            'nroCliente': 'N/A',
            'codigoBarras': '',
            'nombreCliente': '',
            'direccion': '',
            'importe': '0',
            'fechaEmision': '',
            'vencimiento': '',
            'fecha': '',
            'hora': '',
            'distribuidor': '',
            'tipoEntrega': '',
            'medidor': '',
            'comprobante': '',
            'entreCalle': '',
            'codigoPostal': '',
            'dni': '',
            'aclaracion': '',
            'vinculo': '',
            'referencia1': '',
            'referencia2': '',
            'referencia3': '',
            'descripcion': '',
            'foto_url': '',
            'firma_url': '',
            'geo': '',
        }
        
        for field, default in default_fields.items():
            if field not in safe_data or safe_data[field] is None:
                safe_data[field] = default
            elif not isinstance(safe_data[field], str):
                # Convertir a string si no lo es (excepto segundaVisita que ya manejamos)
                if field != 'segundaVisita':
                    safe_data[field] = str(safe_data[field])
        
        # Convertir campos específicos a string para asegurar
        string_fields = ['importe', 'medidor', 'dni']
        for field in string_fields:
            if field in safe_data:
                safe_data[field] = str(safe_data[field])
        
        return safe_data

    def _get_default_safe_data(self):
        """Datos por defecto en caso de error"""
        return {
            'nroCliente': 'ERROR',
            'codigoBarras': '',
            'nombreCliente': 'Error en datos',
            'direccion': '',
            'importe': '0',
            'fechaEmision': '',
            'vencimiento': '',
            'fecha': '',
            'hora': '',
            'distribuidor': '',
            'tipoEntrega': '',
            'medidor': '',
            'comprobante': '',
            'entreCalle': '',
            'codigoPostal': '',
            'dni': '',
            'aclaracion': '',
            'vinculo': '',
            'referencia1': '',
            'referencia2': '',
            'referencia3': '',
            'descripcion': '',
            'foto_url': '',
            'firma_url': '',
            'geo': '',
            'segundaVisita': {'fecha2': '', 'hora2': ''},
        }

    def _draw_visits_safe(self, draw, data, y):
        """Visitas con TextFields y LABELS como React"""
        col_width = (self.image_width - 80) // 2
        label_color = (120, 120, 120)
        
        # Obtener datos de segunda visita
        segunda_visita = data.get('segundaVisita', {})
        if not isinstance(segunda_visita, dict):
            segunda_visita = {}
        
        visits_data = [
            {
                'title': '1ª VISITA',
                'fecha': str(data.get('fecha', '')).strip(),
                'hora': str(data.get('hora', '')).strip(),
                'distribuidor': str(data.get('distribuidor', '')).strip(),
                'tipo_entrega': ''
            },
            {
                'title': '2ª VISITA',
                'fecha': str(segunda_visita.get('fecha2', '')).strip(),
                'hora': str(segunda_visita.get('hora2', '')).strip(),
                'distribuidor': "" if not segunda_visita.get('fecha2') else str(data.get('distribuidor', '')).strip(),
                'tipo_entrega': str(data.get('tipoEntrega', '')).strip()
            }
        ]
        
        # Dibujar ambas visitas
        for i, visit in enumerate(visits_data):
            x = 40 + (i * col_width)
            
            draw.text((x, y), visit['title'],
                    fill=self.colors['text'], font=self.fonts['subtitle1'])
            
            fecha_rect = [(x, y + 25), (x + col_width - 20, y + 25 + 35)]
            draw.rectangle(fecha_rect, outline=self.colors['gray_border'], width=1, fill='white')
            
            draw.text((x + 6, y + 25 + 5), "Fecha",
                    fill=label_color, font=self.fonts['caption'])
            
            if visit['fecha']:
                draw.text((x + 8, y + 25 + 20), visit['fecha'],
                        fill=self.colors['text'], font=self.fonts['body1'])
            
            hora_rect = [(x, y + 65), (x + col_width - 20, y + 65 + 35)]
            draw.rectangle(hora_rect, outline=self.colors['gray_border'], width=1, fill='white')
            
            draw.text((x + 6, y + 65 + 5), "Hora",
                    fill=label_color, font=self.fonts['caption'])
            
            if visit['hora']:
                draw.text((x + 8, y + 65 + 20), visit['hora'],
                        fill=self.colors['text'], font=self.fonts['body1'])
            
            dist_rect = [(x, y + 105), (x + col_width - 20, y + 105 + 35)]
            draw.rectangle(dist_rect, outline=self.colors['gray_border'], width=1, fill='white')
            
            draw.text((x + 6, y + 105 + 5), "Distribuidor",
                    fill=label_color, font=self.fonts['caption'])
            
            if visit['distribuidor']:
                draw.text((x + 8, y + 105 + 20), visit['distribuidor'],
                        fill=self.colors['text'], font=self.fonts['body1'])
            
            if i == 1 and visit['tipo_entrega']:
                tipo_rect = [(x, y + 145), (x + col_width - 20, y + 145 + 35)]
                draw.rectangle(tipo_rect, outline=self.colors['gray_border'], width=1, fill='white')
                
                draw.text((x + 6, y + 145 + 5), "Tipo de Entrega",
                        fill=label_color, font=self.fonts['caption'])
                
                draw.text((x + 8, y + 145 + 20), visit['tipo_entrega'],
                        fill=self.colors['text'], font=self.fonts['body1'])
        
        altura_total = 180 if visits_data[1]['tipo_entrega'] else 145
        return y + altura_total + 20
    
    def _calculate_height(self, data):
        """Calcula altura basada en diseño React"""
        base_height = 1600  
        
        if data.get('segundaVisita', {}).get('fecha2'):
            base_height += 40  
        
        if data.get('foto_url'): base_height += 200
        if data.get('firma_url'): base_height += 150
        if data.get('geo'): base_height += 250  
        
        return base_height
    
    
    def _draw_header(self, draw, img, data, y):
        """Header con 3 columnas IDÉNTICO al React"""
        # Columna 1: Logo EMA (izquierda)
        if 'ema' in self.logos:
            try:
                logo = self.logos['ema']
                max_height = 55
                if logo.height > max_height:
                    ratio = max_height / logo.height
                    new_width = int(logo.width * ratio)
                    logo_resized = logo.resize((new_width, max_height), Image.Resampling.LANCZOS)
                else:
                    logo_resized = logo
                
                x1 = 40
                if logo_resized.mode == 'RGBA':
                    img.paste(logo_resized, (x1, y), logo_resized)
                else:
                    img.paste(logo_resized, (x1, y))
            except Exception as e:
                print(f" Error pegando logo EMA: {e}")
        
        # Columna 2: Código de barras CENTRADO (como React)
        barcode_text = data.get('codigoBarras', '')
        if barcode_text:
            try:
                barcode_img = self.generate_barcode_code39(barcode_text)
                if barcode_img:
                    barcode_x = (self.image_width - barcode_img.width) // 2
                    img.paste(barcode_img, (barcode_x, y))
                    
                    # Texto del código debajo (opcional)
                    text_y = y + barcode_img.height + 5
                    draw.text((self.image_width // 2, text_y), barcode_text,
                            fill=self.colors['text'], font=self.fonts['body2'], anchor="mm")
            except Exception as e:
                print(f" Error código de barras: {e}")
        
        # Columna 3: Info EMA (derecha) - TEXTUAL como React
        ema_info = [
            ("EMA Servicios S.A.", True),      # NEGRITA
            ("R.N.P.S.P. 095", False),         # Regular
            ("Av. San Martín 4970", False),    # Regular
            ("Florida Oeste CP: 1602", False), # Regular
            ("CUIT: 30-69845547-7", False),    # Regular
            ("www.emaservicios.com.ar", False)  # NEGRITA
        ]
        
        right_margin = self.image_width - 40
        for i, (line, is_bold) in enumerate(ema_info):
            if line:
                font = self.fonts['body1_bold'] if is_bold else self.fonts['body1']
                draw.text((right_margin, y + (i * 15)), str(line),
                        fill=self.colors['text'], font=font, anchor="ra")
        
        return y + 100  # Altura usada
    

    def generate_barcode_code39(self, text):
        """
        Versión CORREGIDA - mantiene los asteriscos visibles
        """
        import os
        
        # Ruta directa
        font_path = r"C:\Users\lboldrini\AppData\Local\Microsoft\Windows\Fonts\code3-9.ttf"
        
        try:
            font = ImageFont.truetype(font_path, 40)
            
            barcode_text = f"*{text}*"
            
            temp_img = Image.new('RGB', (1, 1))
            temp_draw = ImageDraw.Draw(temp_img)
            left, top, right, bottom = temp_draw.textbbox((0, 0), barcode_text, font=font)
            
            text_width = right - left
            text_height = bottom - top
            
            padding = 50 
            width = text_width + (padding * 2) 
            height = 50
            
            img = Image.new('RGB', (width, height), 'white')
            draw = ImageDraw.Draw(img)
            
            x = padding  
            y = (height - text_height) // 2
            
            draw.text((x, y), barcode_text, 'black', font)
            
            return img
            
        except Exception as e:
            width = 200
            height = 50
            img = Image.new('RGB', (width, height), 'white')
            draw = ImageDraw.Draw(img)
            draw.text((50, 15), f"*{text}*", 'black')
            return img
    
    def _draw_title_band(self, draw, data, y):
        """Banda azul claro"""
        band_height = 40  
        draw.rectangle([(0, y), (self.image_width, y + band_height)],
                    fill=self.colors['light_blue']) 
        
        title = "Acuse de recibo - Aviso de deuda - Clientes residenciales"
        
        try:
            if os.path.exists("C:/Windows/Fonts/arial.ttf"):
                title_font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
            else:
                title_font = self.fonts.get('body1') or self.fonts['h6']
        except:
            title_font = self.fonts['h6']  
        
        draw.text((self.image_width // 2, y + band_height // 2),
                title, fill=self.colors['text'], font=title_font, anchor="mm")
        
        return y + band_height + 10  
    
    def _draw_delivery_data(self, draw, img, data, y):
        """3 columnas con fondo #f0f8fb IDÉNTICO al React"""
        col_width = (self.image_width - 80) // 3
        box_height = 120  
        
        draw.rectangle([(40, y), (self.image_width - 40, y + box_height)],
                    fill=self.colors['pale_blue'])
        
        x1 = 50
        
        if 'naturgy' in self.logos:
            try:
                naturgy = self.logos['naturgy']
                max_width = 180
                if naturgy.width > max_width:
                    ratio = max_width / naturgy.width
                    new_height = int(naturgy.height * ratio)
                    naturgy_resized = naturgy.resize((max_width, new_height), Image.Resampling.LANCZOS)
                else:
                    naturgy_resized = naturgy
                
                logo_y = y + 10
                if naturgy_resized.mode == 'RGBA':
                    img.paste(naturgy_resized, (x1, logo_y), naturgy_resized)
                else:
                    img.paste(naturgy_resized, (x1, logo_y))
                
                importe_y = logo_y + naturgy_resized.height + 5
                
                draw.text((x1, importe_y), f"Importe: ${data.get('importe', '0')}",
                        fill=self.colors['text'], font=self.fonts['body1_bold'])
                draw.text((x1, importe_y + 20), f"Emisión: {data.get('fechaEmision', '')}",
                        fill=self.colors['text'], font=self.fonts['body1'])
                draw.text((x1, importe_y + 40), f"Fecha vencimiento: {data.get('vencimiento', '')}",
                        fill=self.colors['text'], font=self.fonts['body1'])
                        
            except Exception as e:
                draw.text((x1, y + 10), f"Importe: ${data.get('importe', '0')}",
                        fill=self.colors['text'], font=self.fonts['body1_bold'])
        
        x2 = 50 + col_width
        
        draw.text((x2, y + 10), "Sr/a Usuario/a del servicio de gas:",
                fill=self.colors['text'], font=self.fonts['body1_bold'])
        draw.text((x2, y + 30), f"N° Cliente: {data.get('nroCliente', '')}",
                fill=self.colors['text'], font=self.fonts['body1'])
        draw.text((x2, y + 50), f"N° Medidor: {data.get('medidor', '')}",
                fill=self.colors['text'], font=self.fonts['body1'])
        draw.text((x2, y + 70), f"{data.get('nombreCliente', '')}",
                fill=self.colors['text'], font=self.fonts['body1'])
        draw.text((x2, y + 90), f"Comprobante: {data.get('comprobante', '')}",
                fill=self.colors['text'], font=self.fonts['body1'])
        
        x3 = 50 + (2 * col_width)
        
        draw.text((x3, y + 10), "Domicilio:",
                fill=self.colors['text'], font=self.fonts['body1_bold'])
        draw.text((x3, y + 30), data.get('direccion', ''),
                fill=self.colors['text'], font=self.fonts['body1'])
        draw.text((x3, y + 50), f"Entre calle: {data.get('entreCalle', '')}",
                fill=self.colors['text'], font=self.fonts['body1'])
        draw.text((x3, y + 70), f"CP: {data.get('codigoPostal', '')}",
                fill=self.colors['text'], font=self.fonts['body1'])
        
        return y + box_height + 15
    
    def _draw_additional_data(self, draw, data, y):
        """Datos adicionales con LABELS como React"""
        col_width = (self.image_width - 80) // 2
        label_color = (120, 120, 120)

        # Columna 1: DNI, Aclaración, Vínculo + Checkboxes
        x1 = 40
        
        # ANCHO COMPLETO de la columna izquierda (menos márgenes)
        field_width = col_width - 20 
        
        # Alto de cada TextField
        field_height = 35
        
        # 1. DNI con label
        dni_rect = [(x1, y), (x1 + field_width, y + field_height)]
        draw.rectangle(dni_rect, outline=self.colors['gray_border'], width=1, fill='white')
        
        # Label "D.N.I./C.E./L.E." pequeño
        draw.text((x1 + 6, y + 5), "D.N.I./C.E./L.E.",
                fill=label_color, font=self.fonts['caption'])
        
        # Valor del DNI
        if data.get('dni'):
            draw.text((x1 + 8, y + 20), data['dni'],
                    fill=self.colors['text'], font=self.fonts['body1'])
        
        # 2. Aclaración con label
        acl_rect = [(x1, y + 45), (x1 + field_width, y + 45 + field_height)]
        draw.rectangle(acl_rect, outline=self.colors['gray_border'], width=1, fill='white')
        
        # Label "Aclaración"
        draw.text((x1 + 6, y + 45 + 5), "Aclaración",
                fill=label_color, font=self.fonts['caption'])
        
        # Valor de aclaración
        if data.get('aclaracion'):
            draw.text((x1 + 8, y + 45 + 20), data['aclaracion'],
                    fill=self.colors['text'], font=self.fonts['body1'])
        
        # 3. Vínculo con label
        vin_rect = [(x1, y + 90), (x1 + field_width, y + 90 + field_height)]
        draw.rectangle(vin_rect, outline=self.colors['gray_border'], width=1, fill='white')
        
        # Label "Vínculo"
        draw.text((x1 + 6, y + 90 + 5), "Vínculo",
                fill=label_color, font=self.fonts['caption'])
        
        # Valor del vínculo
        if data.get('vinculo'):
            draw.text((x1 + 8, y + 90 + 20), data['vinculo'],
                    fill=self.colors['text'], font=self.fonts['body1'])
        
        # Título Descripción NO Entrega
        y_desc = y + 150
        draw.text((x1, y_desc), "Descripción NO Entrega:",
                fill=self.colors['text'], font=self.fonts['body1_bold'])
        
        # CHECKBOXES HORIZONTALES 
        opciones = ["Se mudó", "Rehusado", "Otros"]
        descripcion = data.get('descripcion', '').lower()

        # Calcular ancho total disponible para checkboxes
        checkboxes_width = col_width - 20  
        
        checkbox_spacing = 20  
        checkbox_widths = []
        for option in opciones:
            text_width = len(option) * 7  
            checkbox_widths.append(15 + 5 + text_width)  
        
        # Calcular espacio total necesario
        total_needed = sum(checkbox_widths) + (len(opciones) - 1) * checkbox_spacing
        
        # Si no cabe, ajustar espaciado
        if total_needed > checkboxes_width:
            checkbox_spacing = 10
        
        # Calcular punto de inicio para centrar
        start_x = x1
        checkbox_y = y_desc + 25

        for j, option in enumerate(opciones):
            current_x = start_x
            
            # Dibujar checkbox
            checkbox_rect = [
                (current_x, checkbox_y),
                (current_x + 15, checkbox_y + 15)
            ]
            draw.rectangle(checkbox_rect,
                        outline=self.colors['gray_border'], 
                        width=1, 
                        fill='white')
            
            # Marcar si está seleccionado
            if option.lower() in descripcion:
                draw.line([(current_x + 3, checkbox_y + 7),
                        (current_x + 6, checkbox_y + 12)],
                        fill=self.colors['text'], width=2)
                draw.line([(current_x + 6, checkbox_y + 12),
                        (current_x + 12, checkbox_y + 3)],
                        fill=self.colors['text'], width=2)
            
            # Texto al lado
            text_x = current_x + 18
            draw.text((text_x, checkbox_y), option,
                    fill=self.colors['text'], font=self.fonts['body1'])
            
            # Actualizar posición para siguiente checkbox
            text_width = len(option) * 7
            start_x += 15 + 5 + text_width + checkbox_spacing
        
        # Columna 2: Referencias con fondo #f8f8f8 como React
        x2 = 40 + col_width
        draw.text((x2, y), "Referencias:",
                fill=self.colors['text'], font=self.fonts['body1_bold'])
        
        ref_box_width = col_width - 20  

        ref_box = [(x2, y + 25), (x2 + ref_box_width, y + 25 + 100)]
        draw.rectangle(ref_box, 
                    fill=self.colors['light_gray'],  # #f8f8f8
                    outline=self.colors['gray_border'], 
                    width=1)
        
        # Texto de referencias
        refs = [data.get('referencia1'), data.get('referencia2'), data.get('referencia3')]
        ref_y = y + 40
        
        for i, ref in enumerate(refs):
            if ref:
                draw.text((x2 + 10, ref_y), f"{i+1}° REFERENCIA: {ref}",
                        fill=self.colors['text'], font=self.fonts['body1'])
            else:
                draw.text((x2 + 10, ref_y), f"{i+1}° REFERENCIA:",
                        fill=self.colors['gray_border'], font=self.fonts['body1'])
            ref_y += 25
        
        # Calcular altura máxima
        checkboxes_height = y_desc + 30 + (len(opciones) * 25)
        references_height = y + 25 + 100
        
        return max(checkboxes_height, references_height) + 30
    
    def _draw_images_safe(self, draw, img, data, y):
        """Foto, firma y mapa con ESPACIADO EXACTO como React Grid"""
        
        col_width = 452  
        spacing = 16     
        
        # Columna 1: Foto (izquierda) 
        x1 = 40
        
        # Columna 2: Firma y Mapa (derecha)
        x2 = x1 + col_width + spacing
        
        # Variable para altura máxima
        max_y = y

        foto_error = None
        firma_error = None
        mapa_error = None
        
        # 1. FOTO (si existe)
        if data.get('foto_url'):
            try:
                foto_bytes = self._download_image_safe(data['foto_url'])
                if foto_bytes and len(foto_bytes) > 1000:
                    foto_img = Image.open(BytesIO(foto_bytes))
                    try:
                        foto_img.verify()
                        foto_img = Image.open(BytesIO(foto_bytes))
                        
                        # Redimensionar: width="100%" (ancho completo de columna)
                        max_width = col_width
                        if foto_img.width > max_width:
                            ratio = max_width / foto_img.width
                            new_height = int(foto_img.height * ratio)
                            foto_img = foto_img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                        # Si es más pequeña, mantener tamaño original (se alineará arriba)
                        
                        img.paste(foto_img, (x1, y))
                        
                        # Borde como React: borderRadius: 5, border: "1px solid #ccc"
                        draw.rectangle([(x1, y), (x1 + foto_img.width, y + foto_img.height)],
                                    outline=self.colors['gray_border'], width=1)
                        
                        max_y = max(max_y, y + foto_img.height)
                        
                    except:
                        pass  # No mostrar si está corrupta
            except Exception as e:
                print(f"Error foto: {e}")
        
        # Variables para columna derecha
        current_y = y
        columna_derecha_max_y = y
        
        # 2. FIRMA (si existe)
        if data.get('firma_url'):
            try:
                firma_bytes = self._download_image_safe(data['firma_url'])
                if firma_bytes and len(firma_bytes) > 500:
                    firma_img = Image.open(BytesIO(firma_bytes))
                    try:
                        firma_img.verify()
                        firma_img = Image.open(BytesIO(firma_bytes))
                        
                        max_width = col_width
                        if firma_img.width > max_width:
                            ratio = max_width / firma_img.width
                            new_height = int(firma_img.height * ratio)
                            firma_img = firma_img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                        
                        img.paste(firma_img, (x2, current_y))
                        
                        draw.rectangle([(x2, current_y), (x2 + firma_img.width, current_y + firma_img.height)],
                                    outline=self.colors['gray_border'], width=1)
                        
                        current_y += firma_img.height + 10  
                        columna_derecha_max_y = current_y
                        
                    except:
                        pass  
            except Exception as e:
                print(f"Error firma: {e}")
        
        # 3. MAPA (si existe)
        if data.get('geo'):
            try:
                import re
                geo = data['geo']
                
                geo_match = re.search(r'q=(-?\d+\.\d+),(-?\d+\.\d+)', geo)
                if not geo_match:
                    raise ValueError("Coordenadas inválidas en mapa")
                
                lat, lon = geo_match.groups()
                map_url = f"https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=800&height=400&center=lonlat:{lon},{lat}&zoom=15&marker=lonlat:{lon},{lat};type:material;color:%23ff0000;size:large&apiKey=e2055da3173c4cd7b7d0d519574d0582"
                
                map_bytes = self._download_image_safe(map_url, max_width=800)
                if map_bytes:
                    try:
                        map_img = Image.open(BytesIO(map_bytes))
                        map_img.verify()
                        map_img = Image.open(BytesIO(map_bytes))
                        
                        # Redimensionar: width="100%"
                        max_width = col_width
                        if map_img.width > max_width:
                            ratio = max_width / map_img.width
                            new_height = int(map_img.height * ratio)
                            map_img = map_img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                        
                        img.paste(map_img, (x2, current_y))
                        
                        # Contenedor Box React: height: 300 (pero usamos altura real de imagen)
                        draw.rectangle([(x2, current_y), (x2 + map_img.width, current_y + map_img.height)],
                                    outline=self.colors['gray_border'], width=1)
                        
                        # TextField para coordenadas DEBAJO del mapa
                        textfield_y = current_y + map_img.height + 5
                        textfield_width = col_width
                        textfield_height = 35
                        
                        # TextField React
                        draw.rectangle([(x2, textfield_y), (x2 + textfield_width, textfield_y + textfield_height)],
                                    outline=self.colors['gray_border'], width=1, fill='white')
                        
                        # Valor de coordenadas
                        coord_text = f"{lat}, {lon}"
                        draw.text((x2 + 10, textfield_y + textfield_height//2), coord_text,
                                fill=self.colors['text'], font=self.fonts['body1'])
                        
                        columna_derecha_max_y = textfield_y + textfield_height
                        current_y = columna_derecha_max_y
                        
                    except Exception as img_error:
                        # Si la imagen está corrupta
                        raise ValueError(f"Mapa corrupto: {str(img_error)}")
                else:
                    # Si no se pudo descargar el mapa
                    raise ValueError("No se pudo generar mapa")
                    
            except Exception as e:
                # Relanzar el error para que batch_processor lo capture
                raise Exception(f"Error mapa: {str(e)}")
        
        max_y = max(max_y, columna_derecha_max_y)
        
        return max_y + 30 
    
    def _draw_image_placeholder(self, draw, x, y, width, height, text):
        """Dibujar placeholder para imagen faltante o corrupta"""
        draw.rectangle([(x, y), (x + width, y + height)],
                      fill=(245, 245, 245), outline=self.colors['gray_border'], width=1)
        draw.text((x + width//2, y + height//2), text,
                 fill=(150, 150, 150), font=self.fonts['caption'], anchor="mm")
    
    def _generate_emergency_acuse(self, data):
        """Generar acuse mínimo en caso de error catastrófico"""
        try:
            img = Image.new('RGB', (800, 400), self.colors['background'])
            draw = ImageDraw.Draw(img)
            
            draw.text((400, 100), f"ACUSE - Cliente: {data.get('nroCliente', 'N/A')}",
                     fill=self.colors['text'], font=self.fonts['h6'], anchor="mm")
            draw.text((400, 150), f"Importe: ${data.get('importe', '0')}",
                     fill=self.colors['text'], font=self.fonts['body1'], anchor="mm")
            draw.text((400, 200), f"Dirección: {data.get('direccion', '')}",
                     fill=self.colors['text'], font=self.fonts['body1'], anchor="mm")
            draw.text((400, 250), " Generado en modo de emergencia",
                     fill=(255, 0, 0), font=self.fonts['caption'], anchor="mm")
            
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=60, optimize=True)
            return buffer.getvalue()
        except:
            img = Image.new('RGB', (100, 100), self.colors['background'])
            buffer = BytesIO()
            img.save(buffer, format='JPEG')
            return buffer.getvalue()

image_generator = AcuseImageGenerator()