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
    if (positions && positions.length > 0) {
      // Filtrar posiciones válidas
      const validPositions = positions.filter(pos => 
        pos && pos[0] != null && pos[1] != null && !isNaN(pos[0]) && !isNaN(pos[1])
      );
      
      if (validPositions.length > 0) {
        // Crear un LatLngBounds con todas las posiciones válidas
        const bounds = L.latLngBounds(validPositions);
        
        // Ajustar el mapa para mostrar todos los puntos con un pequeño padding
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, positions]);

  return null;
}

function MyMap({ arrayPuntos, arrayCamino, geoJsonData, geoJsonData2 }) {
  const [puntos, setPuntos] = useState([]);
  const [camino, setCamino] = useState([]);
  const [allBounds, setAllBounds] = useState([]);

  const RADIO_COLORS = [
      '#E74C3C', // Rojo vibrante
      '#3498DB', // Azul sólido
      '#2ECC71', // Verde esmeralda
      '#F39C12', // Naranja cálido
      '#9B59B6', // Púrpura
      '#1ABC9C', // Turquesa
      '#E67E22', // Naranja zanahoria
      '#2980B9', // Azul oscuro
      '#27AE60', // Verde bosque
      '#8E44AD'  // Violeta
  ];

  const getRadioColor = (radioId) => {
    if (!radioId) return '#3388ff'; // Color por defecto
    
    // Convertir el radioId a un número para usar como índice
    const radioNumber = parseInt(radioId.toString());
    
    // Usar módulo para ciclar entre los colores disponibles
    const colorIndex = Math.abs(radioNumber) % RADIO_COLORS.length;
    
    return RADIO_COLORS[colorIndex];
  };

  const renderGeoJsonWithRadioColors = () => {
    if (!geoJsonData2) return null;

    // Si geoJsonData2 tiene la nueva estructura con metadata
    if (geoJsonData2.metadata && geoJsonData2.geoData) {
      return geoJsonData2.metadata.map((metadata, index) => {
        const geoDataItem = geoJsonData2.geoData[index];
        const radio = metadata.radio;
        
        if (!geoDataItem) return null;

        return (
          <GeoJSON 
            key={`${metadata.nombre}-${index}`}
            data={geoDataItem} 
            style={{
              color: getRadioColor(radio),
              weight: 3,
              opacity: 0.8,
              fillColor: getRadioColor(radio),
              fillOpacity: 0.3
            }}
            onEachFeature={(feature, layer) => {
              const popupContent = `
                <div>
                  <strong>Nombre:</strong> ${metadata.nombre}<br/>
                  <strong>Sucursal:</strong> ${metadata.sucursal}<br/>
                  <strong>Plan:</strong> ${metadata.plan}<br/>
                  <strong>Radio:</strong> ${radio}<br/>
                  <strong>Antigüedad:</strong> ${metadata.antiguedad}<br/>
                  <strong>Color:</strong> <span style="color:${getRadioColor(radio)}">■</span> ${getRadioColor(radio)}
                </div>
              `;
              layer.bindPopup(popupContent);
            }}
          />
        );
      });
    }
    
    // Si es la estructura antigua (solo array de geoData)
    if (Array.isArray(geoJsonData2)) {
      return geoJsonData2.map((geoJson, index) => (
        geoJson && geoJson.type === "FeatureCollection" && (
          <GeoJSON 
            key={index} 
            data={geoJson} 
            style={getGeoJsonStyle}
            onEachFeature={(feature, layer) => {
              if (feature.properties) {
                const radioId = feature.properties.id || feature.properties.radio;
                const popupContent = `
                  <div>
                    <strong>Radio:</strong> ${radioId || 'N/A'}<br/>
                    <strong>Color:</strong> <span style="color:${getRadioColor(radioId)}">■</span>
                  </div>
                `;
                layer.bindPopup(popupContent);
              }
            }}
          />
        )
      ));
    }
    
    // Si es un objeto individual
    if (geoJsonData2 && geoJsonData2.type === "FeatureCollection") {
      return (
        <GeoJSON 
          data={geoJsonData2} 
          style={getGeoJsonStyle}
          onEachFeature={(feature, layer) => {
            if (feature.properties) {
              const radioId = feature.properties.id || feature.properties.radio;
              const popupContent = `
                <div>
                  <strong>Radio:</strong> ${radioId || 'N/A'}<br/>
                  <strong>Color:</strong> <span style="color:${getRadioColor(radioId)}">■</span>
                </div>
              `;
              layer.bindPopup(popupContent);
            }
          }}
        />
      );
    }

    return null;
  };

  // Efecto para calcular los bounds cuando cambian los datos
  useEffect(() => {
    const bounds = [];

    // Calcular bounds de arrayPuntos
    if (arrayPuntos && arrayPuntos.length > 0) {
      const puntosBounds = arrayPuntos
        .filter(pos => pos && pos[0] != null && pos[1] != null && !isNaN(parseFloat(pos[0])) && !isNaN(parseFloat(pos[1])))
        .map(pos => [parseFloat(pos[0]), parseFloat(pos[1])]);
      if (puntosBounds.length > 0) {
        bounds.push(...puntosBounds);
      }
    }

    // Calcular bounds de arrayCamino
    if (arrayCamino && arrayCamino.length > 0) {
      const caminoBounds = arrayCamino
        .filter(pos => pos && pos[0] != null && pos[1] != null && !isNaN(parseFloat(pos[0])) && !isNaN(parseFloat(pos[1])))
        .map(pos => [parseFloat(pos[0]), parseFloat(pos[1])]);
      if (caminoBounds.length > 0) {
        bounds.push(...caminoBounds);
      }
    }

    // Calcular bounds de geoJsonData (array de GeoJSON)
    if (geoJsonData && geoJsonData.length > 0) {
      geoJsonData.forEach(geoJson => {
        if (geoJson && geoJson.features) {
          geoJson.features.forEach(feature => {
            if (feature.geometry && feature.geometry.coordinates) {
              extractCoordinates(feature.geometry.coordinates, bounds);
            }
          });
        }
      });
    }

    // Calcular bounds de geoJsonData2 (NUEVA ESTRUCTURA con metadata)
    if (geoJsonData2) {
      // Si es la nueva estructura con metadata
      if (geoJsonData2.geoData && Array.isArray(geoJsonData2.geoData)) {
        geoJsonData2.geoData.forEach(geoJson => {
          if (geoJson && geoJson.features) {
            geoJson.features.forEach(feature => {
              if (feature.geometry && feature.geometry.coordinates) {
                extractCoordinates(feature.geometry.coordinates, bounds);
              }
            });
          }
        });
      } 
      // Si es la estructura antigua (array directo)
      else if (Array.isArray(geoJsonData2)) {
        geoJsonData2.forEach(geoJson => {
          if (geoJson && geoJson.features) {
            geoJson.features.forEach(feature => {
              if (feature.geometry && feature.geometry.coordinates) {
                extractCoordinates(feature.geometry.coordinates, bounds);
              }
            });
          }
        });
      } 
      // Si es un objeto individual
      else if (geoJsonData2.features) {
        geoJsonData2.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            extractCoordinates(feature.geometry.coordinates, bounds);
          }
        });
      }
    }

    // Filtrar bounds para eliminar cualquier coordenada undefined
    const validBounds = bounds.filter(coord => 
      coord && coord[0] != null && coord[1] != null && 
      !isNaN(coord[0]) && !isNaN(coord[1])
    );

    setAllBounds(validBounds);
  }, [arrayPuntos, arrayCamino, geoJsonData, geoJsonData2]);

  // Función auxiliar mejorada para extraer coordenadas de GeoJSON
  const extractCoordinates = (coordinates, boundsArray) => {
    if (!coordinates || !Array.isArray(coordinates)) return;
    
    if (Array.isArray(coordinates[0])) {
      // Si es un array de arrays, procesar recursivamente
      coordinates.forEach(coord => extractCoordinates(coord, boundsArray));
    } else if (coordinates.length >= 2) {
      // Es un array de coordenadas [longitud, latitud]
      const lng = coordinates[0];
      const lat = coordinates[1];
      
      // Verificar que las coordenadas sean válidas
      if (lng != null && lat != null && !isNaN(lng) && !isNaN(lat)) {
        // Leaflet usa [latitud, longitud]
        boundsArray.push([lat, lng]);
      }
    }
  };

  const polylineOptions = {
    color: 'blue',
    weight: 5,
  };

  const getGeoJsonStyle = (feature) => {
    const radioId = feature?.properties?.id || feature?.properties?.radio;
    
    return {
      color: getRadioColor(radioId),
      weight: 2,
      opacity: 0.8,
      fillColor: getRadioColor(radioId),
      fillOpacity: 0.4
    };
  };

  // Centro por defecto seguro
  const defaultCenter = [-34.61093894313541, -58.386118685562906];

  return (
    <MapContainer 
      center={allBounds.length > 0 ? allBounds[0] : defaultCenter} 
      zoom={13} 
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {allBounds.length > 0 && <FitBoundsExample positions={allBounds} />}

      {/* Renderizar Polyline del camino con validación */}
      {camino && camino.length > 0 && (
        <Polyline 
          positions={camino
            .filter(pos => pos && pos[0] != null && pos[1] != null && !isNaN(parseFloat(pos[0])) && !isNaN(parseFloat(pos[1])))
            .map(pos => [parseFloat(pos[0]), parseFloat(pos[1])])} 
          {...polylineOptions}
        />
      )}

      {/* Renderizar markers de puntos con validación */}
      {puntos && puntos.length > 0 && puntos.map((punto, index) => (
        punto && punto[0] != null && punto[1] != null && !isNaN(parseFloat(punto[0])) && !isNaN(parseFloat(punto[1])) && (
          <Marker 
            key={index}
            position={[parseFloat(punto[0]), parseFloat(punto[1])]}
            icon={customMarkerIcon}
          >
            <Popup>
              Punto {index + 1}<br />
              Lat: {punto[0]}, Lng: {punto[1]}
            </Popup>
          </Marker>
        )
      ))}

      {/* Renderizar GeoJSON data con validación */}
      {geoJsonData && geoJsonData.length > 0 && geoJsonData.map((route, index) => (
        route && (
          <GeoJSON 
            key={index} 
            data={route} 
            style={getGeoJsonStyle}
            onEachFeature={(feature, layer) => {
              if (feature.properties) {
                const radioId = feature.properties.id || feature.properties.radio;
                const popupContent = `
                  <div>
                    <strong>Radio:</strong> ${radioId || 'N/A'}<br/>
                    <strong>Color:</strong> <span style="color:${getRadioColor(radioId)}">■</span>
                  </div>
                `;
                layer.bindPopup(popupContent);
              }
            }}
          />
        )
      ))}

      {/* NUEVO: Renderizar GeoJSON con colores por radio */}
      {renderGeoJsonWithRadioColors()}

    </MapContainer>
  );
}

export default MyMap;

MyMap.propTypes = {
  arrayPuntos: PropTypes.array.isRequired, // Puntos iniciales
  arrayCamino: PropTypes.array.isRequired, // Camino (rutas) para la polilínea
  geoJsonData: PropTypes.object // GeoJSON para renderizar en el mapa
};