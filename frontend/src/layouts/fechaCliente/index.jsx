import { React, useState } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DatePickerValue from "components/DatePicker";
import SoftInputBase from "components/SoftInputBase";
import { useForm, Controller } from "react-hook-form";
import EnhancedTable from "./data/fechaClienteTable";
import { API_BACK } from "../../config";
import { useAuth } from "layouts/auth/AuthContext";

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
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(null);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState(null);
  const [datosFiltrados, setDatosFiltrados] = useState([]);

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

  const fetchData = (cliente, fechaDesde, fechaHasta) => {
    if (!cliente && !fechaDesde && !fechaHasta) {
      setAllData([]);
      setDatosFiltrados([]);
      return;
    }

    fetch(
      `${API_BACK}/api/fecha-cliente?cliente=${cliente || ""}&grupoCliente=${
        user.idGrupoCliente
      }&fechaDesde=${fechaDesde || ""}&fechaHasta=${fechaHasta || ""}`
    )
      .then((response) => response.json())
      .then((apiData) => {
        if (apiData.dataTabla) {
          setAllData(apiData.dataTabla);
          setColumns(apiData.columns);
          filtrarDatos(apiData.dataTabla, cliente, fechaDesde, fechaHasta);
        } else {
          console.error("No se recibieron datos de la API");
          setAllData([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setAllData([]);
      });
  };

  const filtrarDatos = (data, cliente, fechaDesde, fechaHasta) => {
    const datosFiltrados = data.filter((item) => {
      const itemFecha = new Date(item.fecha).toISOString().split("T")[0]; // Formato YYYY-MM-DD

      const cumpleCliente = cliente ? item.nroCliente === cliente : true;
      const cumpleFechaDesde = fechaDesde ? itemFecha >= fechaDesde : true;
      const cumpleFechaHasta = fechaHasta ? itemFecha <= fechaHasta : true;

      return cumpleCliente && cumpleFechaDesde && cumpleFechaHasta;
    });

    setDatosFiltrados(datosFiltrados);
  };

  return (
    <SoftBox display="flex" flexDirection="column" alignItems="center">
      <SoftBox width="100%">
        <ResponsiveAppBar />
      </SoftBox>

      <Card style={{ marginTop: "7rem", width: "80%" }}>
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
                        <SoftTypography color="error" fontSize="1rem"marginTop={1}>
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

      <SoftBox py={3} style={{ width: "80%" }} justifyContent="center">
        <SoftBox justifyContent="center">
          <Card>
            <SoftBox p={3}>
              <EnhancedTable data={datosFiltrados} columns={columns} />
            </SoftBox>
          </Card>
        </SoftBox>
      </SoftBox>
    </SoftBox>
  );
};

export default FechaCliente;
