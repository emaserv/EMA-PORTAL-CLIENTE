import { React, useEffect, useState } from 'react';
import PropTypes from "prop-types";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Importar imágenes necesarias para el marcador
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Crear el icono personalizado
const customMarkerIcon = L.icon({
  iconUrl: markerIcon, // Imagen del marcador
  shadowUrl: markerShadow, // Sombra del marcador
  iconSize: [25, 41], // Tamaño del icono
  iconAnchor: [12, 41], // Punto donde se "ancla" el icono
  popupAnchor: [1, -34], // Punto donde se abre el popup
  shadowSize: [41, 41] // Tamaño de la sombra
});

function FitBoundsExample({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      // Ajustar el mapa para mostrar todos los puntos
      map.fitBounds(positions);
    }
  }, [map, positions]);

  return null;
}

function MyMap({ arrayPuntos }) { // Cambia arrayPuntos a positions
  // Array de coordenadas para el Polyline
  const [puntos, setPuntos] = useState([]);

  useEffect(() => {
    setPuntos(arrayPuntos);
  }, [arrayPuntos]);

  const polylineOptions = {
    color: 'blue', // Color de la línea
    weight: 5, // Grosor de la línea
  };

  return (
    <MapContainer zoom={16} style={{ height: '300px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
  
      {puntos.length > 0 && puntos.map((pos, index) => {
        return (
          <Marker 
            key={index} 
            position={[parseFloat(pos[0]), parseFloat(pos[1])]} // Asegúrate de usar las coordenadas correctas
            icon={customMarkerIcon}
          >
            <Popup>
              Coordenada {index + 1}: {pos[0]}, {pos[1]}
            </Popup>
          </Marker>
        );
      })}

      {puntos.length > 0 ? 
      <FitBoundsExample positions={puntos} />
      :
      <FitBoundsExample positions={[[-34.61093894313541, -58.386118685562906]]} /> 
      }
    </MapContainer>
  );
}
  
export default MyMap;

MyMap.propTypes = {
  positions: PropTypes.array.isRequired, // Cambia aquí de arrayPuntos a positions
};
