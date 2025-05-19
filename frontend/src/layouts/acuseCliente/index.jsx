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

const generarZIPDeAcuses = async (dataArray, nombreLote) => {
  const zip = new JSZip();
  const concurrencyLimit = 7;

  const procesarAcuse = (item) => {
    return new Promise((resolve) => {
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
            } else {
              console.warn("Fallo al generar blob");
            }

            root.unmount();
            document.body.removeChild(contenedor);
            resolve();
          }}
        />
      );
    });
  };

  const ejecutarEnLotes = async (array, limit) => {
    let index = 0;
    const resultados = [];

    const ejecutarLote = async () => {
      while (index < array.length) {
        const currentIndex = index++;
        await procesarAcuse(array[currentIndex]);
      }
    };

    const workers = Array.from({ length: limit }, ejecutarLote);
    await Promise.all(workers);

    return resultados;
  };

  await ejecutarEnLotes(dataArray, concurrencyLimit);

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${nombreLote}.zip`);
};


const AcuseCliente = () => {
  const { handleSubmit, control } = useForm();
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const onDescargarAcuses = async (formData) => {
    if (!formData.loteSeleccionado) return;
    setLoading(true);

    try {
      const lote = formData.loteSeleccionado;

      // Todos los acuses
      const response = await fetch(
        `${API_BACK}/api/acuses/getAcuses?lote=${encodeURIComponent(lote)}`, { timeout: 500000 }
      );
      const data = await response.json();
      const allAcuses = data.acusesData || [];

      if (allAcuses.length === 0) {
        alert("No se encontraron acuses.");
        return;
      }

      // Divide en bloques de 500
      const chunkSize = 500;
      for (let i = 0; i < allAcuses.length; i += chunkSize) {
        const slice = allAcuses.slice(i, i + chunkSize);
        const nombreZip = `${lote}_parte_${i / chunkSize + 1}`;
        await generarZIPDeAcuses(slice, nombreZip);
      }
    } catch (err) {
      console.error("Error al obtener acuses:", err);
      alert("Ocurrió un error al descargar los acuses.");
    } finally {
      setLoading(false);
    }
  };

  const onDescargarAcuses2 = async (formData) => {
    if (!formData.loteSeleccionado) return;
  setLoading(true);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000000); // 10 minutes

  try {
    const lote = formData.loteSeleccionado;

    const response = await fetch(
      `${API_BACK}/api/acuses/getAcuses?lote=${encodeURIComponent(lote)}`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId); // clear the timeout if fetch succeeds

    const data = await response.json();
    const allAcuses = data.acusesData || [];

    if (allAcuses.length === 0) {
      alert("No se encontraron acuses.");
      return;
    }

    const chunkSize = 500;
    for (let i = 0; i < allAcuses.length; i += chunkSize) {
      const slice = allAcuses.slice(i, i + chunkSize);
      const nombreZip = `${lote}_parte_${i / chunkSize + 1}`;
      await generarZIPDeAcuses(slice, nombreZip);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("La solicitud fue abortada por timeout.");
      alert("La descarga tardó demasiado y fue cancelada.");
    } else {
      console.error("Error al obtener acuses:", err);
      alert("Ocurrió un error al descargar los acuses.");
    }
  } finally {
    setLoading(false);
  }
  };

  return (
    <>
      <LoadingModal isOpen={loading} />
      <SoftBox display="flex" flexDirection="column" alignItems="center">
        <SoftBox width="100%">
          <ResponsiveAppBar />
        </SoftBox>

        <Card
          sx={{
            mt: 12,
            width: { xs: "90%", md: "60%" },
            p: 4,
            boxShadow: 4,
            borderRadius: 3,
          }}
        >
          <SoftTypography variant="h5" fontWeight="bold" mb={3}>
            Selección de Lote
          </SoftTypography>

          <SoftBox
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
            alignItems="center"
          >
            <SoftBox flex={1}>
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
              variant="gradient"
              color="info"
              onClick={handleSubmit(onDescargarAcuses2)}
            >
              DESCARGAR ACUSES
            </SoftButton>
          </SoftBox>
        </Card>
      </SoftBox>
    </>
  );
};

export default AcuseCliente;
