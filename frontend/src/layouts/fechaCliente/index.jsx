import { React, useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DatePickerValue from "components/DatePicker";
import SoftInputBase from "components/SoftInputBase";
import { useForm, Controller } from "react-hook-form";
import PRSTable from "./data/fechaClientePRSTable";
import { API_BACK } from "../../config";
import { useAuth } from "layouts/auth/AuthContext";
import CalleAlturaTable from "./data/fechaClienteCalleAlturaTable";
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

const FechaCliente = () => {
  const { user } = useAuth();
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();
  const [allData, setAllData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [columnsMapa, setColumnsMapa] = useState([]);
  const [puntosMapa, setPuntosMapa] = useState([]);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(null);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState(null);
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [estadoPopUp1, cambiarEstadoPopUp1] = useState(false);

  const onSubmit = async (data) => {
    try {
      const fechaDesde = data.fechaDesde
        ? DataConverter(data.fechaDesde)
        : null;
      const fechaHasta = data.fechaHasta
        ? DataConverter(data.fechaHasta)
        : null;

      setFiltroCliente(data.numCliente || null);
      setFiltroFechaDesde(fechaDesde);
      setFiltroFechaHasta(fechaHasta);

      fetchData(data.numCliente || null, fechaDesde, fechaHasta);
    } catch (error) {
      console.log("Error en el submit:", error);
    }
  };

  const fetchData = async (cliente, fechaDesde, fechaHasta) => {
    if (!cliente && !fechaDesde && !fechaHasta) {
      setAllData([]);
      setPuntosMapa([]);
      setDatosFiltrados([]);
      return;
    }
  
    try {
      // Primera solicitud: fecha-cliente
      const url1 = new URL(`${API_BACK}/api/fecha-cliente`);
      const params1 = {
        cliente: cliente || '',
        grupoCliente: user.idGrupoCliente || '',
        fechaDesde: fechaDesde || '',
        fechaHasta: fechaHasta || '',
      };
  
      Object.keys(params1).forEach((key) => {
        if (params1[key]) {
          url1.searchParams.append(key, params1[key]);
        }
      });
  
      const response1 = await fetch(url1);
      console.log("Response",response1.status)
      const apiData1 = await response1.json();
  
      if (apiData1.dataTabla) {
        setAllData(apiData1.dataTabla);
        setColumns(apiData1.columns);
        filtrarDatos(apiData1.dataTabla, cliente, fechaDesde, fechaHasta);
      } else if (response1.status === 404) {
        cambiarEstadoPopUp1(true)
        console.error("No se recibieron datos de fecha-cliente API");
        setAllData([]);
      }
    } catch (error) {
      console.error("Error en la solicitud fecha-cliente:", error);
      setAllData([]);
    }
  
    try {
      // Segunda solicitud: geoMapaItems
      const url2 = new URL(`${API_BACK}/apiFecha/geoMapaItems`);
      const params2 = {
        cliente: cliente,
        grupoCliente: user.idGrupoCliente,
        fechaDesde: fechaDesde,
        fechaHasta: fechaHasta,
      };
  
      Object.keys(params2).forEach((key) => {
        if (params2[key]) {
          url2.searchParams.append(key, params2[key]);
        }
      });
  
      const response2 = await fetch(url2);
      const apiData2 = await response2.json();
  
      if (apiData2.dataTabla) {
        setPuntosMapa(apiData2.dataTabla);
        setColumnsMapa(apiData2.columns);
      } else {
        console.error("No se recibieron datos de geoMapaItems API");
        setPuntosMapa([]);
      }
    } catch (error) {
      console.error("Error en la solicitud geoMapaItems:", error);
      setPuntosMapa([]);
    }
  };
  
  const convertirFecha = (fechaStr) => {
    const partes = fechaStr.split("/");
    if (partes.length === 3) {
      // Ajusta el año para el formato de 2 dígitos
      const año = partes[2].length === 2 ? `20${partes[2]}` : partes[2];
      return new Date(`${año}-${partes[1]}-${partes[0]}`);
    }
    return new Date(); // Retorna una fecha inválida si el formato no es el esperado
  };

  const filtrarDatos = (
    data,
    cliente,
    fechaDesde,
    fechaHasta
  ) => {
    console.log("DAAA", data)
    const datosFiltrados = data.filter((item) => {
      console.log("WASA1", fechaDesde);
      console.log("WASA2", fechaHasta);
      console.log("WASA3", item.fecha);

      const fechaParts = item.fecha.split("/"); // Divide la fecha en día, mes y año
      const dia = fechaParts[0];
      const mes = fechaParts[1];
      const año = `20${fechaParts[2]}`; // Asume que 'yy' está en el rango 2000-2099
      const itemFecha = `${año}-${mes}-${dia}`; // Reorganiza a 'yyyy-mm-dd'// Formato YYYY-MM-DD
      console.log("WASA33", itemFecha);

      console.log("item", item)
      const cumpleCliente = cliente ? item.nroCliente === cliente : true;
      const cumpleFechaDesde = fechaDesde ? itemFecha >= fechaDesde : true;
      const cumpleFechaHasta = fechaHasta ? itemFecha <= fechaHasta : true;

      console.log("WASA1", fechaDesde);
      console.log("WASA2", fechaHasta);
      console.log("WASA3", itemFecha);

      return (
        cumpleCliente &&
        cumpleFechaDesde &&
        cumpleFechaHasta
      );
    });

    console.log("dataaa", datosFiltrados);

    setDatosFiltrados(datosFiltrados);
  };

  const armarArrayCoordenadas = (data) => {
    console.log("aaa", data);
    let arrayCoordenadas = [];

    for (let i = 0; i < data.length; i++) {
      // Genera valores aleatorios de longitud y latitud
      const latitud = parseFloat(data[i].latitud);
      const longitud = parseFloat(data[i].longitud);
      arrayCoordenadas.push([latitud, longitud]);
    }

    console.log("PRINT ARRAY COORD", arrayCoordenadas);
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
                <SoftTypography marginTop={-2}>N° de Cliente</SoftTypography>
                <Controller
                  name="numCliente"
                  control={control}
                  rules={{ required: "Campo obligatorio" }}
                  render={({ field }) => (
                    <>
                      <SoftInputBase
                        field={field}
                        placeholder="Inserte nro de cliente"
                        error={!!errors.numCliente} // Muestra borde rojo si hay error
                      />
                      {errors.numCliente && (
                        <SoftTypography
                          color="error"
                          fontSize="1rem"
                          marginTop={1}
                        >
                          {errors.numCliente.message}
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
                pt={3}
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
            {user ? (
              <SoftBox p={3}>
                {user.idGrupoCliente === 2 || user.idGrupoCliente === null ? (
                  <MyMap arrayPuntos={armarArrayCoordenadas(puntosMapa)} />
                ) : null}
              </SoftBox>
            ) : null}
          </Card>
        </SoftBox>
      </SoftBox>

      <SoftBox paddingBottom={3} style={{ width: "90%" }} justifyContent="center">
        <SoftBox justifyContent="center">
          <Card>
            {user ? (
              <SoftBox p={3}>
                {user.idGrupoCliente !== 4 ? (
                  <PRSTable data={datosFiltrados} columns={columns} />
                ) : (
                  <CalleAlturaTable data={datosFiltrados} columns={columns} />
                )}
              </SoftBox>
            ) : null}
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
      width={"30vw"}
      height={"15vh"}
      background={"#085397"}
      paddingTopEncabezado={'20px'}
    >
      <Contenido>
        
        {/* Contenido del PopUp */}
        <SoftBox display="flex" justifyContent="center" align-items="center">
          <SoftTypography varint="button" fontWeight="medium" color="dark" px={3}
              py={2} style={{fontSize: '1rem', display:'flex', justifyContent:'center', alignItems:'center'}}>
            No encotramos informacion para este cliente.
          </SoftTypography>
        </SoftBox>
  
      </Contenido>
    </PopUp>

  </>
  );
};

export default FechaCliente;

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