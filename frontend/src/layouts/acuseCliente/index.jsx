// ✅ AcuseCliente.jsx (versión sin onRenderComplete ni renderQueue)

import { React, useEffect, useState } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "layouts/auth/AuthContext";
import { API_BACK } from "../../config";
import LoadingModal from "../../components/loadingModal";
import DropdownList from "components/DropdownList";
import AcuseReciboConFirma from "./components/acuseConFirma";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import ReactDOM from "react-dom/client";
import TablaAcusesCliente from "./data/tablaAcusesCliente.jsx";
import SoftInputBase from "components/SoftInputBase";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from '@mui/icons-material/Download';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';




const generarZIPDeAcuses = async (
  dataArray,
  nombreLote,
  setProgreso,
  parteNro,
) => {
  const zip = new JSZip();
  const concurrencyLimit = 4; 

  const procesarAcuse = (item, index) => {
    return new Promise(async (resolve) => {
      setProgreso(`Generando acuse ${index + 1} de ${dataArray.length} de parte ${parteNro}`);
      await new Promise((res) => setTimeout(res, 50));

      const contenedor = document.createElement("div");
      contenedor.style.position = "fixed";
      contenedor.style.top = "-9999px";
      contenedor.style.left = "0";
      contenedor.style.width = "1000px";
      contenedor.style.zIndex = "-1";
      contenedor.style.backgroundColor = "#fff";
      document.body.appendChild(contenedor);

      const root = ReactDOM.createRoot(contenedor);

      root.render(
        <AcuseReciboConFirma
          data={item}
          onRendered={async (refElement) => {
            const canvas = await html2canvas(refElement, {
              useCORS: true,
              backgroundColor: "#fff",
              scrollY: 0,
              scale: 1.2,
            });

            const blob = await new Promise((res) =>
              canvas.toBlob(res, "image/jpeg", 0.5)
            );

            if (blob) {
              zip.file(`_${item.codigoBarras}.jpg`, blob);
            }

            canvas.width = 0;
            canvas.height = 0;
            root.unmount();
            document.body.removeChild(contenedor);
            resolve();
          }}
        />
      );
    });
  };

  // ✅ Ejecutar en paralelo con límite
  const ejecutarEnLotes = async (array, limit) => {
    let index = 0;

    const ejecutarLote = async () => {
      while (index < array.length) {
        const currentIndex = index++;
        await procesarAcuse(array[currentIndex], currentIndex);
      }
    };

    const workers = Array.from({ length: limit }, ejecutarLote);
    await Promise.all(workers);
  };

  await ejecutarEnLotes(dataArray, concurrencyLimit);

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${nombreLote}.zip`);
};


const AcuseCliente = () => {
  const { handleSubmit, control } = useForm();
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progreso, setProgreso] = useState("");
  const [dataCliente, setDataCliente] = useState([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [acusesPorBloque, setAcusesPorBloque] = useState([]);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [nombreLoteSeleccionado, setNombreLoteSeleccionado] = useState("");


  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const response = await fetch(`${API_BACK}/api/acuses/loteDropDwn`);
        const data = (await response.ok) ? await response.json() : [];

        setLotes(
          data
            .filter((item) => item !== null)
            .map((nombre, index) => ({ id: index, nombre }))
        );
      } catch (error) {
        console.error("Error al obtener lotes:", error);
        setLotes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLotes();
  }, []);

  const onDescargarAcuses2 = async (formData) => {
    if (!formData.loteSeleccionado) return;
    setLoading(true);
    setProgreso("Filtrando acuses...");

    try {
      const lote = formData.loteSeleccionado;
      setNombreLoteSeleccionado(lote);

      const response = await fetch(`${API_BACK}/api/acuses/getAcuses?lote=${encodeURIComponent(lote)}`);
      const data = await response.json();
      const allAcuses = data.acusesData || [];

      if (allAcuses.length === 0) {
        alert("No se encontraron acuses.");
        return;
      }

      const chunkSize = 500;
      const chunks = [];

      for (let i = 0; i < allAcuses.length; i += chunkSize) {
        chunks.push(allAcuses.slice(i, i + chunkSize));
      }

      setAcusesPorBloque(chunks);
    } catch (err) {
      console.error("Error al obtener acuses:", err);
      alert("Ocurrió un error al filtrar los acuses.");
    } finally {
      setLoading(false);
      setProgreso("");
    }
  };

  const onFiltrarPorCliente = async (formData) => {
    if (!formData.numCliente) return;
    setBuscandoCliente(true);
    setProgreso("Buscando acuses del cliente...");
    try {
      const response = await fetch(
        `${API_BACK}/api/acuses/getAcuses?nroCliente=${formData.numCliente}`
      );
      const data = await response.json();
      console.log("RESPONSE CRUDO", data.acusesData);
      setDataCliente(data.acusesData || []);
    } catch (err) {
      console.error("Error al buscar por cliente:", err);
      alert("Error al buscar acuses del cliente");
    } finally {
      setBuscandoCliente(false);
      setProgreso("");
    }
  };

  return (
    <>
      {loading && (
        <SoftBox
          position="fixed"
          top="calc(50% + 60px)"
          left="50%"
          style={{ transform: "translate(-50%, -50%)", zIndex: 999999999 }}
        >
          <SoftTypography variant="h2" color="black" fontWeight="bold">
            {progreso}
          </SoftTypography>
        </SoftBox>
      )}
      <LoadingModal isOpen={loading} />
      <SoftBox display="flex" flexDirection="column" alignItems="center">
        <SoftBox width="100%">
          <ResponsiveAppBar />
        </SoftBox>

        <SoftBox display="flex" justifyContent="center" flexWrap="wrap" gap={2} mt={6} width="100%">
          {/* Card Selección de Lote */}
          <Card
            sx={{
              width: { xs: "100%", md: "48%" },
              p: 4,
              mt: '4rem',
              boxShadow: 4,
              borderRadius: 3,
            }}
          >
            <SoftTypography variant="h5" fontWeight="bold" mb={0}>
              Acuse por Lote
            </SoftTypography>
            <SoftBox
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              gap={2}
              alignItems="center"
            >
              <SoftBox flex={1}>
                <SoftTypography component="label" variant="caption">
                    Lote:
                  </SoftTypography>
                <Controller
                  name="loteSeleccionado"
                  control={control}
                  render={({ field }) => (
                    <DropdownList
                      width="30vw"
                      list={lotes}
                      campoAMostrar="nombre"
                      campoID="nombre"
                      placeholder="Seleccione un Lote"
                      {...field}
                    />
                  )}
                />
              </SoftBox>
              <SoftButton
                sx={{
                    mt: '2rem',
            }}
              
                variant="gradient"
                color="info"
                onClick={handleSubmit(onDescargarAcuses2)}
              >
                FILTRAR
              </SoftButton>
            </SoftBox>
          </Card>

          {/* Card Acuse por N° Cliente */}
          <Card
            sx={{
              width: { xs: "100%", md: "48%" },
              p: 4,
              mt: '4rem',
              boxShadow: 4,
              borderRadius: 3,
            }}
          >
            <SoftTypography variant="h5" fontWeight="bold" mb={0}>
              Acuse por N° Cliente
            </SoftTypography>
            <form onSubmit={handleSubmit(onFiltrarPorCliente)}>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexDirection={{ xs: "column", md: "row" }}
                gap={2}
              >
                <SoftBox flex={1}>
                  <SoftTypography component="label" variant="caption">
                    N° de Cliente
                  </SoftTypography>
                  <Controller
                    name="numCliente"
                    control={control}
                    render={({ field }) => (
                      <SoftInputBase
                        field={field}
                        placeholder="Inserte nro de cliente"
                        autoComplete="off"
                      />
                    )}
                  />
                </SoftBox>
                <SoftBox pt={{ xs: 2, md: 3 }}>
                  <SoftButton variant="gradient" color="info" type="submit">
                    Filtrar
                  </SoftButton>
                </SoftBox>
              </SoftBox>
            </form>
          </Card>
        </SoftBox>


        {/* Tabla resultado búsqueda */}
        {dataCliente.length > 0 && (
          <SoftBox width="98%" mt={0}>
            <TablaAcusesCliente data={dataCliente} />
          </SoftBox>
        )}

        {acusesPorBloque.length > 0 && (
          <SoftBox width="98%" mt={3}>
            {acusesPorBloque.map((bloque, index) => (
              <Accordion
                key={index}
                expanded={expandedAccordion === index}
                onChange={() =>
                  setExpandedAccordion(expandedAccordion === index ? null : index)
                }
                sx={{ mb: 2, boxShadow: 2, borderRadius:"8px" }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    background: "linear-gradient(to top, #2152ff, #21d4fd)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    paddingY: "2px", // controlado
                    paddingX: 2,
                    textTransform: "uppercase",
                    borderRadius: "8px",
                    minHeight: "15px !important", // altura más controlada
                    '& .MuiAccordionSummary-content': {
                      margin: 0, // elimina los márgenes verticales
                      alignItems: "center",
                      height: "100%", // toma el alto del summary
                    },
                    '& .MuiAccordionSummary-expandIconWrapper': {
                      alignSelf: "center", // asegura que el ícono no cambie el alto
                    },
                  }}
                >
                  <span
                    style={{
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    PARTE {index + 1} - {bloque.length} acuses
                  </span>

                  <Tooltip title="Descargar parte">
                    <IconButton
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLoading(true);
                        try {
                          await generarZIPDeAcuses(
                          bloque,
                          `${nombreLoteSeleccionado}_Parte_${index + 1}`,
                          setProgreso,
                          index + 1
                        );

                        } catch (error) {
                          console.error("Error generando ZIP:", error);
                        } finally {
                          setLoading(false);
                          setProgreso(""); // opcional: limpiar progreso cuando termina
                        }
                      }}
                      sx={{ color: "#ffffff", fontSize: "20px" }}
                    >
                      <DownloadIcon />
                    </IconButton>

                  </Tooltip>
                </AccordionSummary>
                <AccordionDetails sx={{ paddingTop: 0, paddingBottom: 2 }}>
                  {expandedAccordion === index && (
                    <TablaAcusesCliente data={bloque} />
                  )}
                </AccordionDetails>

              </Accordion>
            ))}
          </SoftBox>
        )}
      </SoftBox>
    </>
  );
};



export default AcuseCliente;