import { useMap } from "react-leaflet";
import { useEffect } from "react";

function MapLoadWatcher({ onLoaded }) {
  const map = useMap();

  useEffect(() => {
    const handleLoad = () => {
      console.log("✅ Mapa cargado con todos los tiles");
      if (onLoaded) onLoaded();
    };

    map.on("load", handleLoad);

    return () => {
      map.off("load", handleLoad);
    };
  }, [map, onLoaded]);

  return null;
}

export default MapLoadWatcher;
