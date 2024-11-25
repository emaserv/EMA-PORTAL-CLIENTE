import { React, useEffect, useState } from 'react';
import PropTypes from "prop-types";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, GeoJSON } from 'react-leaflet';
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

function MyMap({ arrayPuntos, arrayCamino, geoJsonData, geoJsonData2 }) {
  const [puntos, setPuntos] = useState([]);
  const [camino, setCamino] = useState([]);

  console.log("waos", geoJsonData)
  console.log("waos", geoJsonData2)
  // Efecto para cargar los puntos desde arrayPuntos
  useEffect(() => {
    if (arrayPuntos.length > 0) {
      setPuntos(arrayPuntos);
    }
  }, [arrayPuntos]);

  useEffect(() => {
    if (arrayCamino.length > 0) {
      setCamino(arrayCamino);
    }
  }, [arrayCamino]);

  const polylineOptions = {
    color: 'blue', // Color de la línea
    weight: 5, // Grosor de la línea
  };


  const geoJsonStyle = {
    color: 'blue',
    weight: 1,
    opacity: 0.6,
    fillOpacity: 0.6
  };

  return (
    <MapContainer zoom={16} style={{ height: '300px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {puntos.length > 0 && puntos.map((pos, index) => (
        <Marker 
          key={index} 
          position={[parseFloat(pos[0]), parseFloat(pos[1])]} // Asegúrate de usar las coordenadas correctas
          icon={customMarkerIcon}
        >
          <Popup>
            Coordenada {index + 1}: {pos[0]}, {pos[1]}
          </Popup>
        </Marker>
      ))}

      cambios en la logica para que el mapa se mueva hacia los puntos luego del filtro
      {camino.length > 0 && puntos.length > 0 ? (
        <>
          <Polyline positions={camino.filter(pos => pos[0] && pos[1]).map(pos => [parseFloat(pos[0]), parseFloat(pos[1])])} />
          <FitBoundsExample positions={[...camino.filter(pos => pos[0] && pos[1]).map(pos => [parseFloat(pos[0]), parseFloat(pos[1])]), ...puntos.map(pos => [parseFloat(pos[0]), parseFloat(pos[1])])]} />
        </>
      ) : (
        <FitBoundsExample positions={puntos.length > 0 ? puntos.map(pos => [parseFloat(pos[0]), parseFloat(pos[1])]) : [[-34.61093894313541, -58.386118685562906]]} />
      )}

      {/* Renderizar GeoJSON si se proporciona */}
      {geoJsonData.length > 0 && geoJsonData.map((route, index) => (
        <GeoJSON key={index} data={route} style={{ color: 'red', weight: 5 }} />
      ))}

      {geoJsonData2  && geoJsonData2.type === "FeatureCollection" && (
        <GeoJSON 
          data={geoJsonData2} 
          style={geoJsonStyle} 
      />
      )}

    </MapContainer>
  );
}

export default MyMap;

MyMap.propTypes = {
  arrayPuntos: PropTypes.array.isRequired, // Puntos iniciales
  arrayCamino: PropTypes.array.isRequired, // Camino (rutas) para la polilínea
  geoJsonData: PropTypes.object // GeoJSON para renderizar en el mapa
};