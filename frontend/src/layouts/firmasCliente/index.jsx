import { React, useEffect, useState } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DatePickerValue from "components/DatePicker";
import SoftInputBase from "components/SoftInputBase";
import { useForm, Controller } from "react-hook-form";
import PRSTable from "./data/firmasClienteTable";
import { useAuth } from "layouts/auth/AuthContext";
//import MyMap from "./components/mapa";
import PopUp from "components/PopUp";
import styled from "styled-components";
import {API_BACK} from '../../config'
import LoadingModal from '../../components/loadingModal';
import DropdownList from "components/DropdownList";


import L from 'leaflet';
import { apiFetch } from 'services/api';

const DataConverter = (fechaDeSincronizacion) => {
  const parsedDate = new Date(fechaDeSincronizacion);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const FirmasCliente = () => {
  const { user } = useAuth();
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  const [allData, setAllData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(null);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(null);
  const [filtroPlan, setFiltroPlan] = useState(null);
  const [filtroSucursal, setFiltroSucursal] = useState(null);
  const [filtroRadio, setFiltroRadio] = useState(null);
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [estadoPopUp1, cambiarEstadoPopUp1] = useState(false);
  const [legajo, setLegajo] = useState(null)
  const [hini, setHini] = useState(null)
  const [hfin, setHfin] = useState(null)
  const [isLoading, setIsLoading] = useState(false);
  const [filtroEmision, setFiltroEmision] = useState(null);
  const [multiplesEmision, setMultiplesEmision] = useState([])
  const [mutex, setMutex] = useState(false);

  useEffect(() => {
    if (user) {
      apiFetch(`${API_BACK}/api/emisiones/radioClienteEdesur?idGrupoCliente=${user.idGrupoCliente}`, { mode: "cors" })
        .then((response) => response.json())
        .then((apiData) => {
          if (apiData.multiplesEmision && apiData.columns) {
            setMultiplesEmision(apiData.multiplesEmision);
          }
        })
        .catch((error) => {});
    }
  }, [user]);
   
  const onSubmit = async (data) => {
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

    setIsLoading(true);

    fetchData(
      data.plan || null,
      data.sucursal || null,
      data.radio || null,
      fechaDesde,
      fechaHasta,
      nombreEmision
    );
  };


// Función para realizar la segunda solicitud: radio-cliente
const fetchFirmaCliente = async (plan, sucursal, radio, fechaDesde, fechaHasta, idEmision) => {
  try {
    const response2 = await apiFetch(
      `${API_BACK}/api/radio-cliente?plan=${plan || ""}&sucursal=${sucursal || ""}&radio=${radio || ""}&grupoCliente=${user ? user.idGrupoCliente : null}&fechaDesde=${fechaDesde || ""}&fechaHasta=${fechaHasta || ""}&fechaEmision=${idEmision || ""}`
    );

    const apiData2 = await response2.json();
    if (apiData2.dataTabla) {
      setAllData(apiData2.dataTabla);
      setColumns(apiData2.columns);
      filtrarDatos(apiData2.dataTabla, plan, sucursal, radio, fechaDesde, fechaHasta, idEmision);
    } else if (response2.status === 404) {
      console.error("No se recibieron datos de radio-cliente API");
      cambiarEstadoPopUp1(true);
      setAllData([]);
    }
  } catch (error) {
    console.error("Error en fetchRadioCliente:", error);
  } 
};


const fetchData = async (plan, sucursal, radio, fechaDesde, fechaHasta, idEmision) => {
  if (!plan && !sucursal && !radio && !fechaDesde && !fechaHasta && !idEmision) {
    setAllData([]);
    setDatosFiltrados([]);
    setIsLoading(false);
    return;
  }
  try {
    await fetchFirmaCliente(plan, sucursal, radio, fechaDesde, fechaHasta, idEmision);
  } finally {
    setIsLoading(false); // Desactiva el loading después de completar `fetchFirmaCliente`
  }
};


const filtrarDatos = (data, plan, sucursal, radio, fechaDesde, fechaHasta) => {
    const uniqueData = {}; // Objeto para almacenar combinaciones únicas y su conteo
  
    data.forEach((item) => {
      if (item.estadoPieza === "BM") return; // Excluye los registros con estado "BM"

      const fechaParts = item.fecha.split("/");
      const dia = fechaParts[0];
      const mes = fechaParts[1];
      const año = `20${fechaParts[2]}`;
      const itemFecha = `${año}-${mes}-${dia}`;
  
      const cumplePlan = plan ? item.plan === plan : true;
      const cumpleSucursal = sucursal ? item.sucursal === sucursal : true;
      const cumpleRadio = radio ? item.radio === radio : true;
      const cumpleFechaDesde = fechaDesde ? itemFecha >= fechaDesde : true;
      const cumpleFechaHasta = fechaHasta ? itemFecha <= fechaHasta : true;
      
      // Clave única basada en estado, plan, sucursal, radio, fecha y hora
      if (cumplePlan && cumpleSucursal && cumpleRadio && cumpleFechaDesde && cumpleFechaHasta) {
        const uniqueKey = `${item.estadoPieza}-${item.plan}-${item.sucursal}-${item.radio}-${item.fecha}-${item.hora}`;
  
        if (uniqueData[uniqueKey]) {
          uniqueData[uniqueKey].count += 1;
        } else {
          uniqueData[uniqueKey] = { ...item, count: 1 }; // Agrega `count` con valor inicial 1
        }
      }
    });
  
    const datosFiltrados = Object.values(uniqueData); // Convierte el objeto en un array
  
    setDatosFiltrados(datosFiltrados);
};
  
   

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

        <SoftBox
          py={3}
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
      </SoftBox>

      <LoadingModal isOpen={isLoading} />

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
        paddingTopEncabezado={'20px'}
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
              No encotramos informacion para esta combinacion de plan, sucursal y radio.
            </SoftTypography>
          </SoftBox>
        </Contenido>
      </PopUp>
    </>
  );
};

export default FirmasCliente;

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