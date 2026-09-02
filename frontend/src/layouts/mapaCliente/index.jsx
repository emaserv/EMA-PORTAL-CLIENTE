import { React, useEffect, useMemo, useState } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { useForm, useWatch, Controller } from "react-hook-form";
import { useAuth } from "layouts/auth/AuthContext";
import MyMap from "./components/mapa";
import PopUp from "components/PopUp";
import styled from "styled-components";
import { API_BACK } from "../../config";
import LoadingModal from "../../components/loadingModal";
import DropdownList from "components/DropdownList";
import SoftInputBase from "components/SoftInputBase";
import { apiFetch } from 'services/api';
import { GRADIENT_MODAL_HEADER } from "assets/uiConstants";
import FilterField from "components/FilterField";
import Footer from "components/Footer";

const DataConverter = (fechaDeSincronizacion) => {
  const parsedDate = new Date(fechaDeSincronizacion);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MapaCliente = () => {
  const { user } = useAuth();
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm();

  const [geoJsonData2, setGeoJsonData2] = useState([]);
  const [dataInfo, setDataInfo] = useState([]);
  const [columnsInfo, setColumnsInfo] = useState([]);
  const [multiplesEmision, setMultiplesEmision] = useState([]);
  const [radiosDisponibles, setRadiosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estadoPopUp1, cambiarEstadoPopUp1] = useState(false);

  const planValue = useWatch({ control, name: "plan" });
  const sucursalValue = useWatch({ control, name: "sucursal" });
  const radioValue = useWatch({ control, name: "radio" });

  // Filtrar en el mapa solo los radios seleccionados (si hay alguno seleccionado)
  const geoJsonDataMapa = useMemo(() => {
    if (!geoJsonData2 || !geoJsonData2.metadata || !geoJsonData2.geoData) {
      return geoJsonData2;
    }
    if (!radioValue || radioValue.length === 0) {
      return geoJsonData2;
    }

    const metadata = [];
    const geoData = [];
    geoJsonData2.metadata.forEach((meta, index) => {
      if (radioValue.includes(meta.radio)) {
        metadata.push(meta);
        geoData.push(geoJsonData2.geoData[index]);
      }
    });

    return { metadata, geoData };
  }, [geoJsonData2, radioValue]);

  // Cargar radios disponibles según plan/sucursal (en cascada, con debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const url = new URL(`${API_BACK}/api/geoJson/radiosDisponibles`, window.location.origin);
      if (planValue) url.searchParams.append("plan", planValue);
      if (sucursalValue) url.searchParams.append("sucursal", sucursalValue);

      apiFetch(url, { mode: "cors" })
        .then((response) => response.json())
        .then((apiData) => {
          setRadiosDisponibles(apiData.radios || []);
          setValue("radio", []);
        })
        .catch((error) => {
          console.error("Error cargando radios disponibles:", error);
          setRadiosDisponibles([]);
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [planValue, sucursalValue, setValue]);

  // Cargar datos de información metro
  useEffect(() => {
    apiFetch(
      `${API_BACK}/api/tablaInformacion?grupoCliente=${user ? user.idGrupoCliente : null}`,
      { mode: "cors" }
    )
      .then((response) => response.json())
      .then((apiData) => {
        if (apiData.dataTabla && apiData.columns) {
          setDataInfo(apiData.dataTabla);
          setColumnsInfo(apiData.columns);
        }
      })
      .catch((error) => console.error("Error cargando tabla información:", error));
  }, [user]);

  // Cargar emisiones disponibles
  useEffect(() => {
    if (user) {
      apiFetch(`${API_BACK}/api/emisiones/radioClienteEdesur?idGrupoCliente=${user ? user.idGrupoCliente : null}`,
        { mode: "cors" }
      )
        .then((response) => response.json())
        .then((apiData) => {
          if (apiData.multiplesEmision && apiData.columns) {
            setMultiplesEmision(apiData.multiplesEmision);
          }
        })
        .catch((error) => console.error("Error cargando emisiones:", error));
    }
  }, [user]);

  // Función para obtener datos geoJson
  const fetchGeoJsonData = async (sucursal, plan, radios, antiguedad) => {
    try {
      setLoading(true);

      const params = {};
      if (sucursal) params.sucursal = sucursal;
      if (plan) params.plan = plan;
      if (antiguedad) params.antiguedad = antiguedad;

      const url = new URL(
        `${API_BACK}/api/geoJson/consultarGeoJson`,
        window.location.origin
      );

      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      (radios || []).forEach((radio) => {
        url.searchParams.append("radio", radio);
      });

      const response = await apiFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.geoData && data.metadata) {
        setGeoJsonData2({
          geoData: data.geoData,
          metadata: data.metadata
        });
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

  const onSubmit = async (data) => {
    setGeoJsonData2([]);
    setLoading(true);

    const antiguedad = data.antiguedad || null;
    const plan = data.plan || null;
    const sucursal = data.sucursal || null;
    const radios = Array.isArray(data.radio) ? data.radio : [];
    const idEmisionSeleccionada = data.idEmision;

    const emisionSeleccionada = multiplesEmision.find(
      (emision) => emision.id === idEmisionSeleccionada
    );
    const nombreEmision = emisionSeleccionada ? emisionSeleccionada.nombre : "";

    await fetchGeoJsonData(sucursal, plan, radios, antiguedad);
  };

  // Función para convertir coordenadas a array
  const armarArrayCoordenadas = (data) => {
    let arrayCoordenadas = [];
    
    if (data && data.geoData && Array.isArray(data.geoData)) {
      for (let i = 0; i < data.geoData.length; i++) {
        const latitud = parseFloat(data.geoData[i]?.latitud);
        const longitud = parseFloat(data.geoData[i]?.longitud);
        
        if (!isNaN(latitud) && !isNaN(longitud)) {
          arrayCoordenadas.push([latitud, longitud]);
        }
      }
    }
    
    return arrayCoordenadas;
  };

  return (
    <>
      <SoftBox display="flex" flexDirection="column" alignItems="center">
        <SoftBox width="100%">
          <ResponsiveAppBar />
        </SoftBox>

        {/* Panel de Filtros */}
        <Card style={{ marginTop: "2rem", width: "90%" }}>
          <SoftBox p={3}>
            <SoftTypography variant="h5">Consulta por mapa</SoftTypography>
            <Divider />

            <form onSubmit={handleSubmit(onSubmit)}>
              <SoftBox
                display="flex"
                flexWrap="wrap"
                alignItems="flex-start"
                gap={3}
              >
                <FilterField label="Antiguedad" width="200px" error={errors.antiguedad?.message}>
                  <Controller
                    name="antiguedad"
                    control={control}
                    render={({ field }) => (
                      <DropdownList
                        width="200px"
                        list={[
                          { id: "Nuevo", nombre: "Nuevos" },
                          { id: "Viejo", nombre: "Viejos" }
                        ]}
                        placeholder="Seleccione antiguedad"
                        campoAMostrar="nombre"
                        campoID="id"
                        inputRef={field.ref}
                        value={field.value}
                        onChange={(selectedValue) => field.onChange(selectedValue)}
                      />
                    )}
                  />
                </FilterField>

                <FilterField label="Plan" width="200px">
                  <Controller
                    name="plan"
                    control={control}
                    render={({ field }) => (
                      <SoftInputBase
                        field={field}
                        placeholder="Inserte plan"
                      />
                    )}
                  />
                </FilterField>

                <FilterField label="Sucursal" width="200px">
                  <Controller
                    name="sucursal"
                    control={control}
                    render={({ field }) => (
                      <SoftInputBase
                        field={field}
                        placeholder="Inserte sucursal"
                      />
                    )}
                  />
                </FilterField>

                <FilterField label="Radio" width="200px">
                  <Controller
                    name="radio"
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => (
                      <DropdownList
                        width="200px"
                        list={radiosDisponibles}
                        placeholder="Seleccione radio(s)"
                        campoAMostrar="radio"
                        campoID="radio"
                        multiple
                        isDisabled={radiosDisponibles.length === 0}
                        inputRef={field.ref}
                        value={field.value}
                        onChange={(selectedValue) => field.onChange(selectedValue)}
                      />
                    )}
                  />
                </FilterField>

                <FilterField label="Emision" width="200px" error={errors.idEmision?.message}>
                  <Controller
                    name="idEmision"
                    control={control}
                    render={({ field }) => (
                      <DropdownList
                        width="200px"
                        list={multiplesEmision ? [...multiplesEmision].reverse() : []}
                        placeholder="Seleccione emisión"
                        campoAMostrar="nombre"
                        campoID="id"
                        inputRef={field.ref}
                        value={field.value}
                        onChange={(selectedValue) =>
                          field.onChange(selectedValue)
                        }
                      />
                    )}
                  />
                </FilterField>

                <FilterField label="Filtrar" hideLabel>
                  <SoftButton variant="gradient" color="info" type="submit">
                    Filtrar
                  </SoftButton>
                </FilterField>
              </SoftBox>
            </form>
          </SoftBox>
        </Card>

        {/* Modal de Loading */}
        <LoadingModal isOpen={loading} />

        {/* Mapa */}
        <SoftBox py={3} style={{ width: "90%" }} justifyContent="center">
          <SoftBox justifyContent="center">
            <Card>
              <SoftBox p={3}>
                <MyMap
                  arrayPuntos={[]}
                  arrayCamino={[]}
                  geoJsonData={[]}
                  geoJsonData2={geoJsonDataMapa}
                />
              </SoftBox>
            </Card>
          </SoftBox>
        </SoftBox>

        <Footer />
      </SoftBox>

      {/* PopUp de error */}
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
        background={GRADIENT_MODAL_HEADER}
        paddingTopEncabezado={"20px"}
      >
        <Contenido>
          <SoftBox display="flex" justifyContent="center" alignItems="center">
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
              No encontramos información para esta combinación de plan, sucursal
              y radio.
            </SoftTypography>
          </SoftBox>
        </Contenido>
      </PopUp>
    </>
  );
};

export default MapaCliente;

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