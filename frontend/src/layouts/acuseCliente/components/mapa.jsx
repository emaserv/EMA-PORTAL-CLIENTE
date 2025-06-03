import { React, useEffect, useState } from 'react';
import PropTypes from "prop-types";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  GeoJSON
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icono personalizado para los marcadores
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const customMarkerIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Nuevo componente para centrar el mapa manualmente
function CenterMapManualmente({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 14); // 👈 Cambiá el zoom si querés más o menos alejado
    }
  }, [map, position]);

  return null;
}

function MyMap({ arrayPuntos, arrayCamino, geoJsonData, geoJsonData2 }) {
  const [puntos, setPuntos] = useState([]);
  const [camino, setCamino] = useState([]);

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
    color: 'blue',
    weight: 5,
  };

  const geoJsonStyle = {
    color: 'blue',
    weight: 1,
    opacity: 0.6,
    fillOpacity: 0.6
  };

  // Punto central por defecto si no hay coordenadas
  const defaultCenter = [-34.6109, -58.3861];

  return (
    <MapContainer
      center={puntos.length === 1 ? [parseFloat(puntos[0][0]), parseFloat(puntos[0][1])] : defaultCenter}
      zoom={18}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {puntos.length > 0 && puntos.map((pos, index) => (
        <Marker
          key={index}
          position={[parseFloat(pos[0]), parseFloat(pos[1])]}
          icon={customMarkerIcon}
        >
          <Popup>
            Coordenada {index + 1}: {pos[0]}, {pos[1]}
          </Popup>
        </Marker>
      ))}

      {camino.length > 0 && (
        <Polyline
          positions={camino.filter(pos => pos[0] && pos[1]).map(pos => [parseFloat(pos[0]), parseFloat(pos[1])])}
          pathOptions={polylineOptions}
        />
      )}

      {/* Centrar manualmente si hay solo un punto */}
      {puntos.length === 1 && (
        <CenterMapManualmente position={[parseFloat(puntos[0][0]), parseFloat(puntos[0][1])]} />
      )}

      {/* GeoJSON extra si aplica */}
      {geoJsonData.length > 0 && geoJsonData.map((route, index) => (
        <GeoJSON key={index} data={route} style={{ color: 'green', weight: 5 }} />
      ))}

      {geoJsonData2 && geoJsonData2.type === "FeatureCollection" && (
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
  arrayPuntos: PropTypes.array.isRequired,
  arrayCamino: PropTypes.array.isRequired,
  geoJsonData: PropTypes.array,
  geoJsonData2: PropTypes.object
};