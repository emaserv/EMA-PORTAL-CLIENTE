import { React, useState } from "react";
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

  const onSubmit = (data) => {
    //console.log(data);
    const fechaDesde = data.fechaDesde ? DataConverter(data.fechaDesde) : null;
    const fechaHasta = data.fechaHasta ? DataConverter(data.fechaHasta) : null;

    setFiltroPlan(data.plan || null);
    setFiltroSucursal(data.sucursal || null);
    setFiltroRadio(data.radio || null);
    setFiltroFechaDesde(fechaDesde);
    setFiltroFechaHasta(fechaHasta);

    fetchData(
      data.plan || null,
      data.sucursal || null,
      data.radio || null,
      fechaDesde,
      fechaHasta
    );
  };

  const fetchData = async (plan, sucursal, radio, fechaDesde, fechaHasta) => {
    if (!plan && !sucursal && !radio && !fechaDesde && !fechaHasta) {
      setAllData([]);
      setPuntosMapa([]);
      setCaminoMapa([]);
      setDatosFiltrados([]);
      return;
    }

    // Primera solicitud: geoMapaItems
    try {
      const url = new URL(`/api/radio/geoMapaItems`);
      const params = {
        plan: plan || "",
        sucursal: sucursal || "",
        radio: radio || "",
        grupoCliente: user.idGrupoCliente || "",
        fechaDesde: fechaDesde || "",
        fechaHasta: fechaHasta || "",
      };

      // Agregamos los parámetros a la URL sólo si tienen un valor
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          url.searchParams.append(key, params[key]);
        }
      });

      // Hacemos la petición con fetch
      const response = await fetch(url);

      //console.log("API:", response); // Verifica la respuesta completa
      const apiData1 = await response.json();
      //console.log("Datos de la API:", apiData1);
      if (apiData1.dataTabla) {
        //console.log("PuntosMapa data:", apiData1.dataTabla);
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
    } catch (error) {
      //console.log("error", error);
    }

    try {
      // Segunda solicitud: radio-cliente
      const response2 = await fetch(
        `/api/radio-cliente?plan=${plan || ""}&sucursal=${
          sucursal || ""
        }&radio=${radio || ""}&grupoCliente=${user.idGrupoCliente}&fechaDesde=${
          fechaDesde || ""
        }&fechaHasta=${fechaHasta || ""}`
      );

      const apiData2 = await response2.json();
      //console.log("Response from radio-cliente API:", apiData2); // Verifica la respuesta completa

      if (apiData2.dataTabla) {
        //console.log("Datos de la Tabla:", apiData2);
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
        cambiarEstadoPopUp1(true)
        setAllData([]);
      }
    } catch (error) {
      //console.log("error", error);
    }

    // Tercera solicitud: geoMapaCamino
    try {
      const url = new URL(`/api/geoMapaCamino`);
      const params = {
        plan: plan || "",
        sucursal: sucursal || "",
        radio: radio || "",
        grupoCliente: user.idGrupoCliente || "",
        fechaDesde: fechaDesde || "",
        fechaHasta: fechaHasta || "",
      };

      // Agregamos los parámetros a la URL sólo si tienen un valor
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          url.searchParams.append(key, params[key]);
        }
      });

      // Hacemos la petición con fetch
      const response3 = await fetch(url);

      //console.log("API:", response3); // Verifica la respuesta completa
      const apiData3 = await response3.json();
      //console.log("Datos de la API:", apiData3);
      if (apiData3.dataGeoCamino) {
        //console.log("PuntosCamino data:", apiData3.dataGeoCamino);
        setCaminoMapa(apiData3.dataGeoCamino);
        setColumnsCamino(apiData3.columns);
        filtrarCaminoMapa(
          apiData3.dataGeoCamino,
          plan,
          sucursal,
          radio,
          fechaDesde,
          fechaHasta
        );
      } else {
        console.error("No se recibieron datos de geoCamino API");
        setCaminoMapa([]);
      }
    } catch (error) {
      //console.log("error", error);
    }
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

  const filtrarCaminoMapa = (
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

    //console.log("caminoFiltrado", caminoFiltrado);

    setCaminoMapaFiltrado(caminoFiltrado);
    //console.log("caminoFiltrado", caminoMapaFiltrado);
  };

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

    setPuntosMapaFiltrados(puntosFiltrados);
    //console.log("puntosFiltrados", puntosMapaFiltrados);
  };

  const armarArrayCoordenadas = (data) => {
    //console.log("aaa", data);
    let arrayCoordenadas = [];

    for (let i = 0; i < data.length; i++) {
      // Genera valores aleatorios de longitud y latitud
      const latitud = parseFloat(data[i].latitud);
      const longitud = parseFloat(data[i].longitud);
      arrayCoordenadas.push([latitud, longitud]);
    }

    //console.log("PRINT ARRAY COORD", arrayCoordenadas);
    return arrayCoordenadas;
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

                <SoftBox
                  display="flex"
                  justifyContent="flex-end"
                  alignItems="center"
                  pt={2}
                  px={3}
                >
                  <SoftButton variant="gradient" color="info">
                    <input
                      type="submit"
                      value="Filtrar"
                      style={{
                        background: "transparent",
                        border: "none",
                        fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                        fontSize: "0.875rem",
                        fontWeight: "700",
                        color: "#FFFFFF",
                        textTransform: "uppercase",
                      }}
                    />
                  </SoftButton>
                </SoftBox>
              </SoftBox>
            </form>
          </SoftBox>
        </Card>

        <SoftBox py={3} style={{ width: "90%" }} justifyContent="center">
          <SoftBox justifyContent="center">
            <Card>
              <SoftBox p={3}>
                <MyMap
                  arrayPuntos={armarArrayCoordenadas(puntosMapa)}
                  arrayCamino={armarArrayCoordenadas(caminoMapa)}
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
