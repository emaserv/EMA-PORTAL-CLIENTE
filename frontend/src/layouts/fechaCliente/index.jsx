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
import * as XLSX from 'xlsx';
import { margin } from "@mui/system";
import InformacionMetroTable from "./data/informacionMetroTable";

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
  const [dataInfo, setDataInfo] = useState([]);
  const [columnsInfo, setColumnsInfo] = useState([]);

  useEffect(() => {
    fetch(`${API_BACK}/api/tablaInformacion`, { mode: "cors" })
      .then((response) => response.json())
      .then((apiData) => {
        if (apiData.dataTabla && apiData.columns) {
          setDataInfo(apiData.dataTabla);
          setColumnsInfo(apiData.columns);
        } else {
        }
      })
      .catch((error) => {});
    }, []);

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
        cliente: cliente || "",
        grupoCliente: user.idGrupoCliente || "",
        fechaDesde: fechaDesde || "",
        fechaHasta: fechaHasta || "",
      };

      Object.keys(params1).forEach((key) => {
        if (params1[key]) {
          url1.searchParams.append(key, params1[key]);
        }
      });

      const response1 = await fetch(url1);
      console.log("Response", response1.status);
      const apiData1 = await response1.json();

      if (apiData1.dataTabla) {
        setAllData(apiData1.dataTabla);
        setColumns(apiData1.columns);
        filtrarDatos(apiData1.dataTabla, cliente, fechaDesde, fechaHasta);
      } else if (response1.status === 404) {
        cambiarEstadoPopUp1(true);
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

  const filtrarDatos = (data, cliente, fechaDesde, fechaHasta) => {
    console.log("DAAA", data);
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

      console.log("item", item);
      const cumpleCliente = cliente ? item.nroCliente === cliente : true;
      const cumpleFechaDesde = fechaDesde ? itemFecha >= fechaDesde : true;
      const cumpleFechaHasta = fechaHasta ? itemFecha <= fechaHasta : true;

      console.log("WASA1", fechaDesde);
      console.log("WASA2", fechaHasta);
      console.log("WASA3", itemFecha);

      return cumpleCliente && cumpleFechaDesde && cumpleFechaHasta;
    });

    console.log("dataaa", datosFiltrados);

    setDatosFiltrados(datosFiltrados);
  };

  const armarArrayCoordenadas = (data) => {
    console.log("dataaaaaa", data);

    let arrayCoordenadas = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i].latitud && data[i].longitud) {
        // Genera valores aleatorios de longitud y latitud
        const latitud = parseFloat(data[i].latitud);
        const longitud = parseFloat(data[i].longitud);
        arrayCoordenadas.push([latitud, longitud]);
      }
    }

    console.log("PRINT ARRAY COORD", arrayCoordenadas);
    return arrayCoordenadas;
  };

  const exportarAExcel = (data) => {
    const regex = /[^/]+ \/ [^/]+ \/ [^/]+/;
  
    const formattedData = data.map(row => {
      // Comprobación de coincidencia con regex
      if (regex.test(row.obsVisita)) {

        // esto es para splitear la obs de visita en dni nombre observacion
        const splitBySlash = (str) => {
          return str.split('/');
        };
        

        // Caso 1: Si cumple con el regex
        return {
          "Fecha Emision": row.fechaEmision || '-',
          "Numero de Cliente": row.nroCliente || '-',
          "Titular": row.titular || '-',
          "Direccion": row.direccion || '-',
          "Localidad": row.localidad || '-',
          "Fecha de Distribucion": row.fecha || '-',
          "Hora": row.hora || '-',
          "Estado EMA": row.estadoPieza || '-',
          "Estado Metrogas": row.estadoMetro || '-',
          "Observacion de Visita": splitBySlash(row.obsVisita)[2] || '-',
          "DNI": splitBySlash(row.obsVisita)[0] || '-',
          "Nombre": splitBySlash(row.obsVisita)[1] || '-',
          "Visita": row.geoVisita || '-',
          "Foto": row.foto || '-',
          "Firma": row.firma || '-',
          "Imagen Aviso Deuda": '-',
        };
      } else {
        return {
          "Fecha Emision": row.fechaEmision || '-',
          "Numero de Cliente": row.nroCliente || '-',
          "Titular": row.titular || '-',
          "Direccion": row.direccion || '-',
          "Localidad": row.localidad || '-',
          "Fecha de Distribucion": row.fecha || '-',
          "Hora": row.hora || '-',
          "Estado EMA": row.estadoPieza || '-',
          "Estado Metrogas": row.estadoMetro || '-',
          "Observacion de Visita": row.obsVisita || '-',
          "DNI": '-',
          "Nombre": '-',
          "Visita": row.geoVisita || '-',
          "Foto": row.foto || '-',  
          "Firma": row.firma || '-',
          "Imagen Aviso Deuda": '-', 
        };
      }
    });
  
    // Creación y exportación del archivo Excel
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, 'Consulta-fecha-cliente.xlsx');
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
                flexDirection={{ xs: "column", md: "row" }} // Responsive layout
              >
                <SoftBox>
                  <SoftTypography
                    marginTop={-2}
                    fontSize={{ xs: "1rem", sm: "1.25rem" }} // Responsive font size
                  >
                    N° de Cliente
                  </SoftTypography>
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
                
                <SoftBox
                  display="flex"
                  flexDirection="column"
                  marginTop={{ xs: 2, md: -2 }}
                  marginLeft={{ md: 3 }}
                >
                  <SoftTypography
                    marginBottom={-1}
                    fontSize={{ xs: "1rem", sm: "1.25rem" }}
                  >
                    Fecha
                  </SoftTypography>
                  <SoftBox display="flex" alignItems="center" flexDirection={{ xs: "column", md: "row" }}>
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
                  <SoftButton variant="gradient" color="info" type="submit">
                    Filtrar
                  </SoftButton>
                </SoftBox>
              </SoftBox>
            </form>
          </SoftBox>
        </Card>
        
        
        <SoftBox paddingTop={3} style={{ width: "90%" }} justifyContent="center">
        {user && (user.idGrupoCliente === 2 ||
                    user.idGrupoCliente === null) &&
                  puntosMapa ? (
          <SoftBox justifyContent="center">
            <Card>
                <SoftBox p={3}>
                    <MyMap arrayPuntos={armarArrayCoordenadas(puntosMapa)} />
                </SoftBox>
            </Card>
          </SoftBox>
          
        ) : null}
        </SoftBox>

        <SoftBox
          paddingBottom={3}
          style={{ width: "90%" }}
          justifyContent="center"
        >
          <SoftBox justifyContent="center">
            <Card>
              {user ? (
                <>
                <SoftBox sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <SoftButton
                    variant="gradient"
                    color="info"
                    onClick={() => exportarAExcel(datosFiltrados, 'Consulta Cliente')}
                    type="submit"
                    style={{
                      border: "none",
                      marginTop: "1.25rem", 
                      marginLeft: "1.5rem"
                    }}
                  >
                    Exportar a Excel
                  </SoftButton>
                </SoftBox>
                <SoftBox p={3}>
                  {user.idGrupoCliente !== 4 ? (
                    <PRSTable data={datosFiltrados} columns={columns} />
                  ) : (
                    <CalleAlturaTable data={datosFiltrados} columns={columns} />
                  )}
                </SoftBox>
                </>
              ) : null}
            </Card>
          </SoftBox>
        </SoftBox>


        {user && user.idGrupoCliente === 4? (
        <SoftBox
          paddingBottom={3}
          style={{ width: "90%" }}
          justifyContent="center"
        >
          <SoftBox justifyContent="center">
            <Card>
                <SoftBox p={3}>
                  <InformacionMetroTable data={dataInfo} columns={columnsInfo} />
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
        width={"30vw"}
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
