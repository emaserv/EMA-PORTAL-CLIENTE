import { React, useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "layouts/auth/AuthContext";
import * as XLSX from "xlsx";
import axios from "axios";
import InformacionMetroTable from "./data/informacionMetroTable";
import { API_BACK } from "../../config";
import LoadingModal from "../../components/loadingModal";
import DropdownList from "components/DropdownList";
import AlertDlg from "components/AlertDlg";
import CalleAlturaTableMetro from "./data/fechaClienteCalleAlturaTableMetro";
import CalleAlturaTableNaturgy from "./data/fechaClienteCalleAlturaTableNaturgy";

const InformesCliente = () => {
  const { user } = useAuth();
  const {
    handleSubmit,
    control,
    formState: { errors },
    getValues,
  } = useForm();
  const [dataInfo, setDataInfo] = useState([]);
  const [columnsInfo, setColumnsInfo] = useState([]);
  const [dataEmision, setDataEmision] = useState([]);
  const [multiplesEmision, setMultiplesEmision] = useState([]);
  const [columnsEmision, setColumnsEmision] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mutex, setMutex] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");

  useEffect(() => {
    fetch(`${API_BACK}/api/tablaInformacion`, { mode: "cors" })
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
      fetch(`${API_BACK}/api/emisiones?idGrupoCliente=${user ? user.idGrupoCliente : null}`, { mode: "cors" })
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

  console.log(multiplesEmision);

  const onSubmit = async (data) => {
    fetchData(data.idEmision);
  };

  const fetchData = async (idEmision) => {
    if (!idEmision) {
      setDataEmision([]);
      return;
    }

    setLoading(true);

    try {
      // Primera solicitud: fecha-cliente
      const url1 = `${API_BACK}/api/informe-emision?idEmision=${idEmision}&idGrupoCliente=${user.idGrupoCliente}`; // La URL base debe configurarse en axios o agregarla completa aquí

      const response1 = await axios.get(url1);
      console.log("Response", response1.status);
      const apiData1 = response1.data;

      if (apiData1.dataTabla) {
        setDataEmision(apiData1.dataTabla);
        setColumnsEmision(apiData1.columns);
      } else {
        setDataEmision([]);
      }
    } catch (error) {
      console.error("Error en la solicitud cliente-emision:", error);
      setDataEmision([]);
    }
    setLoading(false)
  };

  const exportarAExcel = async (idEmision) => {
    if (!idEmision) {
      console.error("ID de Emisión no seleccionado.");
      return;
    }

    setLoading(true);
    
    try {
  
      const url = `${API_BACK}/api/informe-emision-extendido?idEmision=${idEmision}&idGrupoCliente=${user.idGrupoCliente}`;      
      const response = await axios.get(url);
      const apiData = response.data;
  
      if (apiData.dataTabla) {
        // Formatear los datos para exportar
        const formattedData = (() => {
          if (user.idGrupoCliente === 4) {
            return apiData.dataTabla.map((row) => ({
              //ID: row.id || "-",
              "Fecha Emisión": row.fechaEmision || "-",
              "Número Cliente": row.nroCliente || "-",
              Titular: row.titular || "-",
              //Plan: row.plan || "-",
              //Sucursal: row.sucursal || "-",
              //Radio: row.radio || "-",
              Dirección: row.direccion || "-",
              Localidad: row.localidad || "-",
              Fecha: row.fecha || "-",
              Hora: row.hora || "-",
              "Estado Pieza": row.estadoPieza || "-",
              "Estado Metro": row.estadoMetro || "-",
              "Observación Visita": row.obsVisita || "-",
              GeoVisita: row.geoVisita || "-",
              Foto: row.foto || "-",
              Firma: row.firma || "-",
            }));
          } else if (user.idGrupoCliente === 2) {
            return apiData.dataTabla.map((row) => ({
              //ID: row.id || "-",
              "Fecha Emisión": row.fechaEmision || "-",
              "Número Cliente": row.nroCliente || "-",
              Titular: row.titular || "-",
              //Plan: row.plan || "-",
              //Sucursal: row.sucursal || "-",
              //Radio: row.radio || "-",
              Dirección: row.direccion || "-",
              Localidad: row.localidad || "-",
              Fecha: row.fecha || "-",
              //Hora: row.hora || "-",
              "Estado Pieza": row.estadoPieza || "-",
              //"Estado Metro": row.estadoMetro || "-",
              "Observación Visita": row.obsVisita || "-",
              //GeoVisita: row.geoVisita || "-",
              Acuse: row.foto || "-",
              //Firma: row.firma || "-",
            }));
          }
          return []; // En caso de que no se cumplan las condiciones
        })();
        
  
        // Crear el archivo Excel
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Datos Emisión");
        XLSX.writeFile(workbook, "Datos_Emision.xlsx");
      } else {
        console.error("No se encontraron datos para la emisión seleccionada.");
        setAlertTitle("No se encontraron datos para la emisión seleccionada.");
        setAlertOpen(true);
      }
    } catch (error) {
      console.error("Error al exportar datos a Excel:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Estado de loading:", loading);
  }, [loading]);
  

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
                {/* Fila de Emisión y DropdownList */}
                <SoftBox
                  display="flex"
                  alignItems="center" // Centra verticalmente
                  gap={2} // Espacio horizontal entre etiqueta y dropdown
                  flexDirection={{ xs: "column", md: "row" }} // Responsive
                >
                  {/* Etiqueta */}
                  <SoftTypography
                    component="label"
                    variant="caption"
                    fontSize={{ xs: "0.75rem", sm: "1rem" }}
                    style={{ marginBottom: "0px" }} // Elimina margen inferior
                  >
                    Emisión:
                  </SoftTypography>

                  {/* DropdownList */}
                  <Controller
                    name="idEmision"
                    control={control}
                    rules={{ required: "Campo obligatorio" }}
                    render={({ field }) => (
                      <>
                        <DropdownList
                          width="70vw"
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

                {/* Botón de Filtrar */}
                <SoftBox
                  display="flex"
                  justifyContent="flex-end"
                  alignItems="center"
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

        <LoadingModal isOpen={loading} />

        <SoftBox
          paddingBottom={3}
          paddingTop={3}
          style={{ width: "90%" }}
          justifyContent="center"
        >
          <SoftBox justifyContent="center">
            <Card>
              {user ? (
                <>
                  <SoftBox
                    sx={{ display: "flex", justifyContent: "flex-start" }}
                  >
                    <SoftButton
                      variant="gradient"
                      color="info"
                      // onClick={() =>
                      //   exportarAExcel(dataEmision, "Consulta Emision")
                      // }
                      onClick={() => {
                        const idEmision = getValues("idEmision"); // Usar getValues para obtener el ID de emisión seleccionado
                        console.log("ID de Emisión seleccionado:", idEmision);
                        if (!idEmision) {
                          console.error("Por favor, seleccione una emisión antes de exportar.");
                          return;
                        }
                        exportarAExcel(idEmision);
                      }}
                      type="submit"
                      style={{
                        border: "none",
                        marginTop: "1.25rem",
                        marginLeft: "1.5rem",
                      }}
                    >
                      Exportar a Excel
                    </SoftButton>
                    <AlertDlg titulo={alertTitle} open={alertOpen} setOpen={setAlertOpen} />
                  </SoftBox>
                  <SoftBox paddingTop={3} px={3}>
                    {user.idGrupoCliente === 4 ? (
                      <CalleAlturaTableMetro
                        data={dataEmision}
                        columns={columnsEmision}
                      />
                    ) :  user.idGrupoCliente === 2 ? (
                      <CalleAlturaTableNaturgy
                        data={dataEmision}
                        columns={columnsEmision}
                      />
                    ) : null}
                  </SoftBox>
                </>
              ) : null}
            </Card>
          </SoftBox>

        
        </SoftBox>
        {user && user.idGrupoCliente === 4 ? (
          <SoftBox style={{ width: "90%" }} justifyContent="center">
            <SoftBox justifyContent="center" paddingBottom={3}>
              <Card>
                <SoftBox px={3} paddingBottom={2} paddingTop={3}>
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
    </>
  );
};

export default InformesCliente;
