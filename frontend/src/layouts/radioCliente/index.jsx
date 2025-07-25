import { React, useEffect, useState } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DatePickerValue from "components/DatePicker";
import SoftInputBase from "components/SoftInputBase";
import { useForm, Controller } from "react-hook-form";
import PRSTable from "./data/radioClienteTable";
import { useAuth } from "layouts/auth/AuthContext";
import MyMap from "./components/mapa";
import PopUp from "components/PopUp";
import styled from "styled-components";
import { API_BACK } from "../../config";
import InformacionMetroTable from "./data/informacionMetroTable";
import LoadingModal from "../../components/loadingModal";
import DropdownList from "components/DropdownList";

import L from "leaflet";


const DataConverter = (fechaDeSincronizacion) => {
  const parsedDate = new Date(fechaDeSincronizacion);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const RadioCliente = () => {
  const { user } = useAuth();
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  const [allData, setAllData] = useState([]);
  const [puntosMapa, setPuntosMapa] = useState([]);
  const [puntosMapaFiltrados, setPuntosMapaFiltrados] = useState([]);
  const [caminoMapa, setCaminoMapa] = useState([]);
  const [caminoMapaFiltrado, setCaminoMapaFiltrado] = useState([]);
  const [columns, setColumns] = useState([]);
  const [columnsCamino, setColumnsCamino] = useState([]);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(null);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(null);
  const [filtroPlan, setFiltroPlan] = useState(null);
  const [filtroSucursal, setFiltroSucursal] = useState(null);
  const [filtroRadio, setFiltroRadio] = useState(null);
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [estadoPopUp1, cambiarEstadoPopUp1] = useState(false);
  const [loading, setLoading] = useState(false); // Estado para manejar el loading
  const [legajo, setLegajo] = useState(null);
  const [hini, setHini] = useState(null);
  const [hfin, setHfin] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState([]);
  const [geoJsonData2, setGeoJsonData2] = useState([]);
  const [dataInfo, setDataInfo] = useState([]);
  const [columnsInfo, setColumnsInfo] = useState([]);
  const [filtroEmision, setFiltroEmision] = useState(null);
  const [multiplesEmision, setMultiplesEmision] = useState([])
  const [mutex, setMutex] = useState(false);

  


  useEffect(() => {
    fetch(
      `${API_BACK}/api/tablaInformacion?grupoCliente=${user ? user.idGrupoCliente : null}`,
      { mode: "cors" }
    )
      .then((response) => response.json())
      .then((apiData) => {
        if (apiData.dataTabla && apiData.columns) {
          setDataInfo(apiData.dataTabla);
          setColumnsInfo(apiData.columns);
          setMutex(true);
        } else {
        }
      })
      .catch((error) => {});
  }, []);

  useEffect(() => {
      if (mutex) {
        fetch(`${API_BACK}/api/emisiones/radioClienteEdesur?idGrupoCliente=${user ? user.idGrupoCliente : null}`, { mode: "cors" })
          .then((response) => response.json())
          .then((apiData) => {
            if (apiData.multiplesEmision && apiData.columns) {
              setMultiplesEmision(apiData.multiplesEmision);
            } else {
            }
          })
          .catch((error) => {});
      }
    }, [mutex, user]);

  const onSubmit = async (data) => {
      setCaminoMapa([]);
      setPuntosMapa([]);
      setGeoJsonData([]);
      setGeoJsonData2([]);
      setCaminoMapaFiltrado([]);

    setLoading(true);

    const fechaDesde = data.fechaDesde ? DataConverter(data.fechaDesde) : null;
    const fechaHasta = data.fechaHasta ? DataConverter(data.fechaHasta) : null;
    const idEmisionSeleccionada = data.idEmision;
    const emisionSeleccionada = multiplesEmision.find(
      (emision) => emision.id === idEmisionSeleccionada
    );
    const nombreEmision = emisionSeleccionada ? emisionSeleccionada.nombre : "";

    setFiltroPlan(data.plan || null);
    setFiltroSucursal(data.sucursal || null);
    setFiltroRadio(data.radio || null);
    setFiltroFechaDesde(fechaDesde);
    setFiltroFechaHasta(fechaHasta);
    setFiltroEmision(nombreEmision);

    await fetchData(
      data.plan || null,
      data.sucursal || null,
      data.radio || null,
      fechaDesde,
      fechaHasta,
      nombreEmision
    );
  };

  // Función para formatear un valor a dos dígitos
  const formatToTwoDigits = (value) => {
    return value && value.length === 1 ? `0${value}` : value;
  };

  // Función para realizar la solicitud a la API de geoJson
  const fetchGeoJsonData = async (sucursal, plan, radio) => {
    try {
      setLoading(true);
      const formattedPlan = formatToTwoDigits(plan);
      const formattedSucursal = formatToTwoDigits(sucursal);
      const formattedRadio = formatToTwoDigits(radio);

      const url = new URL(
        `${API_BACK}/api/geoJson/consultarGeoJson`,
        window.location.origin
      );
      const params = {
        sucursal: formattedSucursal,
        plan: formattedPlan,
        radio: formattedRadio,
      };

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.geoData) {
        console.log("radio", data.geoData);
        setGeoJsonData2(data.geoData);
      } else {
        console.error("No se encontraron datos para esta combinación.");
        setGeoJsonData2([]);
      }
    } catch (error) {
      console.error("Error en fetchGeoJsonData:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para realizar la primera solicitud: geoMapaItems
  // Función para realizar la primera solicitud: geoMapaItems
  const fetchGeoMapaItems = async (
    plan,
    sucursal,
    radio,
    fechaDesde,
    fechaHasta,
    idEmision
  ) => {
    try {
      setLoading(true);
      // Create the base URL object
      const url = new URL(
        `${API_BACK}/api/radio/geoMapaItems`,
        window.location.origin
      );

      // Define parameters with default values if not provided
      const params = {
        plan: plan || "",
        sucursal: sucursal || "",
        radio: radio || "",
        grupoCliente: user ? user.idGrupoCliente : null || "",
        fechaDesde: fechaDesde || "",
        fechaHasta: fechaHasta || "",
        fechaEmision: idEmision || "",
      };

      // Append each non-empty parameter to the URL
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value);
        }
      });

      // Fetch data from the API with the constructed URL
      const response = await fetch(url);
      const apiData1 = await response.json();

      // Check for data and update the state accordingly
      if (apiData1.dataTabla) {
        setPuntosMapa(apiData1.dataTabla);
        setColumns(apiData1.columns);
        filtrarPuntosMapa(
          apiData1.dataTabla,
          plan,
          sucursal,
          radio,
          fechaDesde,
          fechaHasta
        );
      } else {
        console.error("No se recibieron datos de geoMapaItems API");
        setPuntosMapa([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error en fetchGeoMapaItems:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Función para realizar la segunda solicitud: radio-cliente
  const fetchRadioCliente = async (
    plan,
    sucursal,
    radio,
    fechaDesde,
    fechaHasta,
    idEmision
  ) => {
    try {
      setLoading(true);
      const response2 = await fetch(
        `${API_BACK}/api/radio-cliente?plan=${plan || ""}&sucursal=${
          sucursal || ""
        }&radio=${radio || ""}&grupoCliente=${user ? user.idGrupoCliente : null}&fechaDesde=${
          fechaDesde || ""
        }&fechaHasta=${fechaHasta || ""}&fechaEmision=${idEmision || ""}`
      );

      const apiData2 = await response2.json();
      if (apiData2.dataTabla) {
        setAllData(apiData2.dataTabla);
        setColumns(apiData2.columns);
        filtrarDatos(
          apiData2.dataTabla,
          plan,
          sucursal,
          radio,
          fechaDesde,
          fechaHasta
        );
      } else if (response2.status === 404) {
        console.error("No se recibieron datos de radio-cliente API");
        cambiarEstadoPopUp1(true);
        setAllData([]);
      }
    } catch (error) {
      console.error("Error en fetchRadioCliente:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para realizar la tercera solicitud: geoMapaCamino
  const fetchGeoMapaCamino = async () => {
    try {
      const url = new URL(`${API_BACK}/api/geo-dai`, window.location.origin);

      const params = {
        legajo: legajo,
        hini: hini.toISOString(),
        hfin: hfin.toISOString(),
      };

      console.log("HOLAA", hini.toISOString());
      console.log("HOLAA", hfin.toISOString());

      Object.keys(params).forEach((key) => {
        if (params[key]) {
          url.searchParams.append(key, params[key]);
        }
      });

      const response3 = await fetch(url);
      const apiData3 = await response3.json();

      if (apiData3.dataGeoCamino) {
        const results = await processCoordinates(apiData3.dataGeoCamino);
        console.log(results);
        setGeoJsonData(results);
        setColumnsCamino(apiData3.columns);
      } else {
        console.error("No se recibieron datos de geoCamino API");
        setGeoJsonData([]);
      }
    } catch (error) {
      console.error("Error en fetchGeoMapaCamino:", error);
    }
  };

  const fetchData = async (plan, sucursal, radio, fechaDesde, fechaHasta, idEmision) => {
    if (!plan && !sucursal && !radio && !fechaDesde && !fechaHasta && !idEmision) {
      setAllData([]);
      setPuntosMapa([]);
      setCaminoMapa([]);
      setDatosFiltrados([]);
      setGeoJsonData([]);
      return;
    }

    // Llamadas a las tres funciones
    await fetchGeoJsonData(sucursal, plan, radio);
    await fetchGeoMapaItems(plan, sucursal, radio, fechaDesde, fechaHasta);
    await fetchRadioCliente(plan, sucursal, radio, fechaDesde, fechaHasta);
  };

  const filtrarDatos = (
    data,
    plan,
    sucursal,
    radio,
    fechaDesde,
    fechaHasta
  ) => {
    //console.log("DAAA", data);
    const datosFiltrados = data.filter((item) => {
      //console.log("WASA1", fechaDesde);
      //console.log("WASA2", fechaHasta);
      //console.log("WASA3", item.fecha);

      const fechaParts = item.fecha.split("/"); // Divide la fecha en día, mes y año
      const dia = fechaParts[0];
      const mes = fechaParts[1];
      const año = `20${fechaParts[2]}`; // Asume que 'yy' está en el rango 2000-2099
      const itemFecha = `${año}-${mes}-${dia}`; // Reorganiza a 'yyyy-mm-dd'// Formato YYYY-MM-DD
      //console.log("WASA33", itemFecha);

      const cumplePlan = plan ? item.plan === plan : true;
      const cumpleSucursal = sucursal ? item.sucursal === sucursal : true;
      const cumpleRadio = radio ? item.radio === radio : true;
      const cumpleFechaDesde = fechaDesde ? itemFecha >= fechaDesde : true;
      const cumpleFechaHasta = fechaHasta ? itemFecha <= fechaHasta : true;

      //console.log("WASA1", fechaDesde);
      //console.log("WASA2", fechaHasta);
      //console.log("WASA3", itemFecha);

      return (
        cumplePlan &&
        cumpleSucursal &&
        cumpleRadio &&
        cumpleFechaDesde &&
        cumpleFechaHasta
      );
    });

    //console.log("dataaa", datosFiltrados);

    setDatosFiltrados(datosFiltrados);
  };

  const filtrarCaminoMapa = async (
    data,
    plan,
    sucursal,
    radio,
    fechaDesde,
    fechaHasta
  ) => {
    const caminoFiltrado = data.filter((item) => {
      const itemFecha = new Date(item.fecha).toISOString().split("T")[0]; // Formato YYYY-MM-DD

      const cumplePlan = plan ? item.plan === plan : true;
      const cumpleSucursal = sucursal ? item.sucursal === sucursal : true;
      const cumpleRadio = radio ? item.radio === radio : true;
      const cumpleFechaDesde = fechaDesde ? itemFecha >= fechaDesde : true;
      const cumpleFechaHasta = fechaHasta ? itemFecha <= fechaHasta : true;

      return (
        cumplePlan &&
        cumpleSucursal &&
        cumpleRadio &&
        cumpleFechaDesde &&
        cumpleFechaHasta
      );
    });

    const caminoAchicado = await processCoordinates(caminoFiltrado);
    console.log("caminoFiltrado", caminoAchicado);

    setCaminoMapaFiltrado(caminoAchicado);
    //console.log("caminoFiltrado", caminoMapaFiltrado);
  };

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Función para filtrar las coordenadas
  function filterClosePoints(data, threshold = 50) {
    return data.filter((currentPoint, index) => {
      // Comprueba la distancia de cada punto anterior en el array
      for (let i = 0; i < index; i++) {
        const prevPoint = data[i];
        const distance = haversineDistance(
          parseFloat(prevPoint.latitud),
          parseFloat(prevPoint.longitud),
          parseFloat(currentPoint.latitud),
          parseFloat(currentPoint.longitud)
        );
        if (distance < threshold) {
          return false; // Excluir el punto si está a menos de 80 metros
        }
      }
      return true; // Mantener el punto si pasa el filtro
    });
  }

  // Función para dividir el array en chunks
  function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Función para obtener la ruta desde la API de OSRM
  async function getRouteFromAPI(chunk) {
    const coordString = chunk
      .map((coord) => `${coord.longitud},${coord.latitud}`)
      .join(";");
    const routeURL = `https://router.project-osrm.org/route/v1/foot/${coordString}?geometries=geojson`;

    console.log(routeURL); // Para depuración

    const response = await fetch(routeURL);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry; // Retornar la geometría de la ruta
    } else {
      console.error(
        "No se encontraron rutas para este conjunto de coordenadas."
      );
      return null;
    }
  }

  // Función principal que procesa las coordenadas
  async function processCoordinates(data) {
    const filteredData = filterClosePoints(data);
    //console.log(filteredData.length)
    //const reFilteredData =  filtrarPorDistanciaMultiple(puntosMapa, filteredData);
    //console.log(reFilteredData.length)
    const chunks = chunkArray(filteredData, 25);
    const results = [];

    for (const chunk of chunks) {
      const routeGeometry = await getRouteFromAPI(chunk);

      if (routeGeometry) {
        // Crear una línea con la geometría de la ruta y añadirla al mapa
        const geojson = L.geoJSON(routeGeometry, {
          style: {
            color: "#ff0000",
            weight: 9,
            opacity: 0.4,
          },
        });

        results.push(routeGeometry); // Guardar las coordenadas procesadas
      }
    }

    return results;
  }

  const filtrarPuntosMapa = (
    data,
    plan,
    sucursal,
    radio,
    fechaDesde,
    fechaHasta
  ) => {
    const puntosFiltrados = data.filter((item) => {
      const itemFecha = ""; // new Date(item.fechaDistrib).toISOString().split("T")[0]; // Formato YYYY-MM-DD

      const cumplePlan = plan ? item.plan === plan : true;
      const cumpleSucursal = sucursal ? item.sucursal === sucursal : true;
      const cumpleRadio = radio ? item.radio === radio : true;
      //const cumpleFechaDesde = fechaDesde ? itemFecha >= fechaDesde : true;
      //const cumpleFechaHasta = fechaHasta ? itemFecha <= fechaHasta : true;

      return cumplePlan && cumpleSucursal && cumpleRadio; // && cumpleFechaDesde && cumpleFechaHasta;
    });

    //console.log("puntosFiltrados", puntosFiltrados);
    if (data.length > 0) {
      // Convertir el campo de fecha y hora al formato ISO
      const fechas = data.map((item) => {
        const formattedDate = `${item.fecha} ${item.hora}`; // Asumiendo que la hora ya está en formato HH:mm:ss
        return new Date(formattedDate);
      });

      // Obtener la mínima y máxima fecha usando Math.min y Math.max
      const fechaMin = new Date(Math.min(...fechas));
      const fechaMax = new Date(Math.max(...fechas));

      console.log("HOLAA", fechaMin, fechaMax);
      // Guardar los resultados en el estado
      setHini(fechaMin);
      setHfin(fechaMax);
    }

    setLegajo(data[0].legajo);

    setPuntosMapaFiltrados(puntosFiltrados);
    //console.log("puntosFiltrados", puntosMapaFiltrados);
  };

  const armarArrayCoordenadas = (data) => {
    console.log("datita", data)

    //console.log("aaa", data);
    let arrayCoordenadas = [];

    for (let i = 0; i < data.length; i++) {
      // Aseguramos que los valores sean números válidos
      const latitud = parseFloat(data[i]?.latitud);
      const longitud = parseFloat(data[i]?.longitud);

      if (!isNaN(latitud) && !isNaN(longitud)) {
        arrayCoordenadas.push([latitud, longitud]);
      } else {
        console.warn(
          `Coordenada inválida en índice ${i}: latitud=${data[i]?.latitud}, longitud=${data[i]?.longitud}`
        );
      }
    }

    console.log("Coordenadas procesadas:", arrayCoordenadas);
    return arrayCoordenadas;
  };

  function calcularDistanciaEnKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Función principal para filtrar las coordenadas del array grande basado en el array de referencia
  function filtrarPorDistanciaMultiple(arrayReferencia, arrayCoordenadas) {
    return arrayCoordenadas.filter((coord) => {
      // Verifica si la coordenada está dentro del radio de alguna coordenada en el array de referencia
      return arrayReferencia.some((ref) => {
        const distancia = calcularDistanciaEnKm(
          ref.latitud,
          ref.longitud,
          coord.latitud,
          coord.longitud
        );

        return distancia <= 1.5;
      });
    });
  }

  useEffect(() => {
    if (!legajo) return;
    fetchGeoMapaCamino();
    setLegajo(null);
  }, [legajo]);

  return (
    <>
      <SoftBox display="flex" flexDirection="column" alignItems="center">
        <SoftBox width="100%">
          <ResponsiveAppBar />
        </SoftBox>

        <Card style={{ marginTop: "7rem", width: "90%" }}>
          <SoftBox p={3}>
            <SoftTypography variant="h4">Filtros</SoftTypography>
            <Divider />

            <form onSubmit={handleSubmit(onSubmit)}>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >

                <SoftBox>
                  <SoftTypography marginTop={-2}>Plan</SoftTypography>
                  <Controller
                    name="plan"
                    control={control}
                    rules={{ required: "Campo obligatorio" }}
                    render={({ field }) => (
                      <>
                        <SoftInputBase
                          field={field}
                          placeholder="Inserte nro de plan"
                          error={!!errors.plan} // Muestra borde rojo si hay error
                        />
                        {errors.plan && (
                          <SoftTypography
                            color="error"
                            fontSize="1rem"
                            marginTop={1}
                          >
                            {errors.plan.message}
                          </SoftTypography>
                        )}
                      </>
                    )}
                  />
                </SoftBox>

                <SoftBox>
                  <SoftTypography marginTop={-2}>Sucursal</SoftTypography>
                  <Controller
                    name="sucursal"
                    control={control}
                    rules={{ required: "Campo obligatorio" }}
                    render={({ field }) => (
                      <>
                        <SoftInputBase
                          field={field}
                          placeholder="Inserte nro de sucursal"
                          error={!!errors.sucursal} // Muestra borde rojo si hay error
                        />
                        {errors.sucursal && (
                          <SoftTypography
                            color="error"
                            fontSize="1rem"
                            marginTop={1}
                          >
                            {errors.sucursal.message}
                          </SoftTypography>
                        )}
                      </>
                    )}
                  />
                </SoftBox>

                <SoftBox>
                  <SoftTypography marginTop={-2}>Radio</SoftTypography>
                  <Controller
                    name="radio"
                    control={control}
                    rules={{ required: "Campo obligatorio" }}
                    render={({ field }) => (
                      <>
                        <SoftInputBase
                          field={field}
                          placeholder="Inserte nro de radio"
                          error={!!errors.radio} // Muestra borde rojo si hay error
                        />
                        {errors.radio && (
                          <SoftTypography
                            color="error"
                            fontSize="1rem"
                            marginTop={1}
                          >
                            {errors.radio.message}
                          </SoftTypography>
                        )}
                      </>
                    )}
                  />
                </SoftBox>
                
                {user &&
                (user.idGrupoCliente !== 1) ? (
                  <SoftBox display="flex" flexDirection="column" marginTop={-2}>
                    <SoftTypography marginBottom={-1}>Fecha</SoftTypography>
                    <SoftBox display="flex" alignItems="center">
                      <Controller
                        name="fechaDesde"
                        control={control}
                        render={({ field }) => <DatePickerValue field={field} />}
                      />
                      <SoftTypography> - </SoftTypography>
                      <Controller
                        name="fechaHasta"
                        control={control}
                        render={({ field }) => <DatePickerValue field={field} />}
                      />
                    </SoftBox>
                  </SoftBox>
                ) : null}

                <SoftBox
                  display="flex"
                  flexDirection="column"
                  marginTop={{ xs: 2, md: -2 }}
                  marginLeft={{ md: 3 }}
                >
                  <SoftTypography
                    component="label"
                    variant="caption"
                    marginTop={2}
                    fontSize={{ xs: "0.75rem", sm: "1rem" }}
                  >
                    Emision
                  </SoftTypography>
                  <SoftBox
                    display="flex"
                    alignItems="center"
                    flexDirection={{ xs: "column", md: "row" }}
                    marginTop={1}
                  >
                    <Controller
                      name="idEmision"
                      control={control}
                      render={({ field }) => (
                        <>
                          <DropdownList
                            width="10vw"
                            list={multiplesEmision ? multiplesEmision.reverse() : []}
                            placeholder="Seleccione su emisión"
                            campoAMostrar="nombre"
                            campoID="id"
                            inputRef={field.ref}
                            value={field.value}
                            onChange={(selectedValue) =>
                              field.onChange(selectedValue)
                            }
                          />
                          {errors.idEmision && (
                            <SoftTypography
                              color="error"
                              fontSize="1rem"
                              marginTop={1}
                            >
                              {errors.idEmision.message}
                            </SoftTypography>
                          )}
                        </>
                      )}
                    />
                  </SoftBox>
                </SoftBox>

                <SoftBox
                  display="flex"
                  justifyContent="flex-end"
                  alignItems="center"
                  pt={2}
                  px={3}
                >
                  <SoftButton
                    variant="gradient"
                    color="info"
                    type="submit" // Asegúrate de incluir el tipo "submit" aquí
                  >
                    Filtrar
                  </SoftButton>
                </SoftBox>
              </SoftBox>
            </form>
          </SoftBox>
        </Card>

        <LoadingModal isOpen={loading} />

        <SoftBox py={3} style={{ width: "90%" }} justifyContent="center">
          <SoftBox justifyContent="center">
            <Card>
              <SoftBox p={3}>
                <MyMap
                  arrayPuntos={armarArrayCoordenadas(puntosMapa)}
                  arrayCamino={armarArrayCoordenadas(caminoMapa)}
                  geoJsonData={geoJsonData}
                  geoJsonData2={geoJsonData2}
                />
              </SoftBox>
            </Card>
          </SoftBox>
        </SoftBox>

        <SoftBox
          paddingBottom={3}
          style={{ width: "90%" }}
          justifyContent="center"
        >
          <SoftBox justifyContent="center">
            <Card>
              <SoftBox p={3}>
                <PRSTable data={datosFiltrados} columns={columns} />
              </SoftBox>
            </Card>
          </SoftBox>
        </SoftBox>

        {user && (user.idGrupoCliente === 4 || user.idGrupoCliente === 1) ? (
          <SoftBox
            paddingBottom={3}
            style={{ width: "90%" }}
            justifyContent="center"
          >
            <SoftBox justifyContent="center">
              <Card>
                <SoftBox p={3}>
                  <InformacionMetroTable
                    data={dataInfo}
                    columns={columnsInfo}
                  />
                </SoftBox>
              </Card>
            </SoftBox>
          </SoftBox>
        ) : null}
      </SoftBox>

      <PopUp
        estado={estadoPopUp1}
        cambiarEstado={cambiarEstadoPopUp1}
        titulo=""
        mostrarHeader={true}
        mostrarOverlay={true}
        posicionModal={"center"}
        padding={"0px"}
        width={"40vw"}
        height={"15vh"}
        background={"#085397"}
        paddingTopEncabezado={"20px"}
      >
        <Contenido>
          {/* Contenido del PopUp */}
          <SoftBox display="flex" justifyContent="center" align-items="center">
            <SoftTypography
              varint="button"
              fontWeight="medium"
              color="dark"
              px={3}
              py={2}
              style={{
                fontSize: "1rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              No encotramos informacion para esta combinacion de plan, sucursal
              y radio.
            </SoftTypography>
          </SoftBox>
        </Contenido>
      </PopUp>
    </>
  );
};

export default RadioCliente;

const Contenido = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  h1 {
    font-size: 42px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  p {
    font-size: 18px;
    margin-bottom: 20px;
  }

  img {
    width: 100%;
    vertical-align: top;
    border-radius: 3px;
  }
`;
