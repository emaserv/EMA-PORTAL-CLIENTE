import { React, useState } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DatePickerValue from "components/DatePicker";
import SoftInputBase from "components/SoftInputBase";
import { useForm, Controller } from "react-hook-form";
import EnhancedTable from "./data/radioClienteTable";
import { API_BACK } from "../../config";
import { useAuth } from "layouts/auth/AuthContext";

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
  const [columns, setColumns] = useState([]);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(null);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(null);
  const [filtroPlan, setFiltroPlan] = useState(null);
  const [filtroSucursal, setFiltroSucursal] = useState(null);
  const [filtroRadio, setFiltroRadio] = useState(null);
  const [datosFiltrados, setDatosFiltrados] = useState([]);

  const onSubmit = async (data) => {
    try {
      const fechaDesde = data.fechaDesde
        ? DataConverter(data.fechaDesde)
        : null;
      const fechaHasta = data.fechaHasta
        ? DataConverter(data.fechaHasta)
        : null;

      setFiltroPlan(data.plan || null);
      setFiltroSucursal(data.sucursal || null);
      setFiltroRadio(data.radio || null);
      setFiltroFechaDesde(fechaDesde);
      setFiltroFechaHasta(fechaHasta);

      fetchData(data.plan || null, data.sucursal || null, data.radio || null, fechaDesde, fechaHasta);
    } catch (error) {
      console.log("Error en el submit:", error);
    }
  };

  const fetchData = (plan, sucursal, radio, fechaDesde, fechaHasta) => {
    if (!plan && !sucursal && !radio && !fechaDesde && !fechaHasta) {
      setAllData([]);
      setDatosFiltrados([]);
      return;
    }

    fetch(
      `${API_BACK}/api/radio-cliente?plan=${plan || ""}&sucursal=${sucursal || ""}&radio=${radio || ""}&grupoCliente=${
        user.idGrupoCliente
      }&fechaDesde=${fechaDesde || ""}&fechaHasta=${fechaHasta || ""}`
    )
      .then((response) => response.json())
      .then((apiData) => {
        if (apiData.dataTabla) {
          setAllData(apiData.dataTabla);
          setColumns(apiData.columns);
          filtrarDatos(apiData.dataTabla, plan, sucursal, radio, fechaDesde, fechaHasta);
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

  const filtrarDatos = (data, plan, sucursal, radio, fechaDesde, fechaHasta) => {
    const datosFiltrados = data.filter((item) => {
      const itemFecha = new Date(item.fecha).toISOString().split("T")[0]; // Formato YYYY-MM-DD

      const cumplePlan = plan ? item.plan === plan : true;
      const cumpleSucursal = sucursal ? item.sucursal === sucursal : true;
      const cumpleRadio = radio ? item.radio === radio : true;
      const cumpleFechaDesde = fechaDesde ? itemFecha >= fechaDesde : true;
      const cumpleFechaHasta = fechaHasta ? itemFecha <= fechaHasta : true;

      return cumplePlan && cumpleSucursal && cumpleRadio && cumpleFechaDesde && cumpleFechaHasta;
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
                        <SoftTypography color="error" fontSize="1rem"marginTop={1}>
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
                        <SoftTypography color="error" fontSize="1rem"marginTop={1}>
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
                        <SoftTypography color="error" fontSize="1rem"marginTop={1}>
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

export default RadioCliente;
