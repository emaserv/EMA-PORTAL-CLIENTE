import { React, useEffect, useState, useCallback } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Alert as MuiAlert, Snackbar, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "layouts/auth/AuthContext";
import { API_BACK } from "../../config";
import { saveAs } from "file-saver";
import TablaAcusesCliente from "./data/tablaAcusesCliente.jsx";
import SoftInputBase from "components/SoftInputBase";
import LoadingModal from "../../components/loadingModal";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import DropdownList from "components/DropdownList";
import AcuseReciboConFirma from "./components/acuseConFirma";
import html2canvas from "html2canvas";
import ReactDOM from "react-dom/client";
import { apiFetch } from 'services/api';
import { COLOR_ICON_ACTIVE } from 'assets/uiConstants';
import Footer from "components/Footer";

const AcuseCliente = () => {
  const { handleSubmit, control } = useForm();
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState("");
  const [dataCliente, setDataCliente] = useState([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [activeTasks, setActiveTasks] = useState([]);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState("");
  const [procesandoExcel, setProcesandoExcel] = useState(false);
  const { user } = useAuth();
  const [renderizando, setRenderizando] = useState(false);

  // Mostrar snackbar
  const mostrarSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
  };

  // Cargar lotes
  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const response = await apiFetch(`${API_BACK}/api/acuses/loteDropDwn`);
        const data = (await response.ok) ? await response.json() : [];
        setLotes(
          data
            .filter((item) => item !== null)
            .map((nombre, index) => ({ id: index, nombre }))
        );
      } catch (error) {
        console.error("Error al obtener lotes:", error);
        setLotes([]);
      }
    };
    fetchLotes();
  }, []);

  // Obtener tareas activas
  const obtenerTareasActivas = useCallback(async () => {
    try {
      const response = await apiFetch(`${API_BACK}/api/acuses-async/active-tasks`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActiveTasks(data.active_tasks || []);
        }
      }
    } catch (error) {
      console.error("Error obteniendo tareas:", error);
    }
  }, []);

  // Monitoreo automático
  useEffect(() => {
    let intervalo = null;
    
    if (activeTasks.length > 0) {
      intervalo = setInterval(() => {
        obtenerTareasActivas();
      }, 5000);
      
      return () => {
        if (intervalo) clearInterval(intervalo);
      };
    }
  }, [activeTasks.length, obtenerTareasActivas]);

  // Iniciar generación
  const iniciarGeneracionAsync = async (tipo, valor, nombreDescarga) => {
    try {
      const checkResponse = await apiFetch(`${API_BACK}/api/acuses-async/can-generate`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (!checkData.can_generate) {
          mostrarSnackbar("Ya hay una generación de acuses en curso. Espere a que termine.", "warning");
          return;
        }
      }
    } catch (checkError) {
      console.error("Error verificando estado:", checkError);
    }
    
    setLoading(true);
    setProgreso("⏳ Iniciando generación...");
    setCurrentTaskId(null);
    
    try {
      const requestData = tipo === 'lote' 
        ? { lote: valor }
        : { nroCliente: valor };
      
      const response = await apiFetch(`${API_BACK}/api/acuses-async/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (!result.success) {
        if (result.error && (
            result.error.includes("Ya hay una generación") ||
            result.error.includes("generación en curso") ||
            result.status === 423
          )) {
          throw new Error("⏳ " + result.error);
        }
        throw new Error(result.error || 'Error al iniciar generación');
      }
      
      setCurrentTaskId(result.task_id);
      await obtenerTareasActivas();
      await monitorearTarea(result.task_id, nombreDescarga);
      
    } catch (error) {
      mostrarSnackbar(` ${error.message}`, "error");
      setLoading(false);
      setProgreso("");
      setCurrentTaskId(null);
    }
  };

  // Monitorear tarea
  const monitorearTarea = async (taskId, nombreDescarga) => {
    let attempts = 0;
    const maxAttempts = 4500;
    let pollingActive = true;
    let cancelledDetected = false;
    
    while (pollingActive && attempts < maxAttempts && !cancelledDetected) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await apiFetch(`${API_BACK}/api/acuses-async/status/${taskId}`);
        const status = await statusResponse.json();
        
        if (!status.success) {
          if (status.status === "expired" || status.status === "gone") {
            mostrarSnackbar("La tarea ya no está disponible", "info");
          } else {
            mostrarSnackbar(` ${status.error || 'Error al verificar estado'}`, "error");
          }
          pollingActive = false;
          setLoading(false);
          setProgreso("");
          setCurrentTaskId(null);
          break;
        }

        if (status.status === 'processing') {
          setProgreso(status.message);
        }

        if (status.status === 'cancelled' || status.cancelled) {
          cancelledDetected = true;
          mostrarSnackbar("Generación cancelada", "info");
          setProgreso("Cancelada");
          setLoading(false);
          setCurrentTaskId(null);
          pollingActive = false;
          break;
        } else if (status.status === 'completed') {
            await descargarResultado(taskId, nombreDescarga);

            const totalGenerados = status.total_generados || 0;
            const totalErrores = status.total_con_errores || 0;

            if (totalErrores > 0) {
              mostrarSnackbar(
                `${totalGenerados} acuses generados\n  ${totalErrores} con errores - Revisa el archivo CSV dentro del ZIP`,
                "warning"
              );
            } else {
              mostrarSnackbar(
                ` ${totalGenerados} acuses generados correctamente`,
                "success"
              );
            }

            await obtenerTareasActivas();
            setProgreso("Completado");
            setCurrentTaskId(null);
            setLoading(false);
            return;

        } else if (status.status === 'failed') {
          mostrarSnackbar(` ${status.error || 'La generación falló'}`, "error");
          pollingActive = false;
          setLoading(false);
          setProgreso("");
          setCurrentTaskId(null);
          break;
        }

      } catch (error) {
        console.error(`Error en monitoreo:`, error);
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts && pollingActive) {
      setLoading(false);
      setProgreso("");
      mostrarSnackbar(" Tiempo de espera agotado", "warning");
    }
  };

  // Descargar resultado
  const descargarResultado = async (taskId, nombreDescarga) => {
    try {
      const downloadResponse = await apiFetch(`${API_BACK}/api/acuses-async/download/${taskId}`);
      
      if (!downloadResponse.ok) {
        throw new Error('Error al descargar el archivo');
      }
      
      const blob = await downloadResponse.blob();
      saveAs(blob, `${nombreDescarga}.zip`);
      
    } catch (error) {
      console.error("Error descargando resultado:", error);
      throw error;
    }
  };

  const cancelarTarea = async (taskId) => {
    try {
      setProgreso("Cancelando...");
      
      const url = `${API_BACK}/api/acuses-async/cancel/${taskId}`;
      
      const response = await apiFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setLoading(false);
        setProgreso("");
        setCurrentTaskId(null); 
        mostrarSnackbar(" Tarea cancelada exitosamente", "success");
        await obtenerTareasActivas();
      } else {
        mostrarSnackbar(` Error: ${result.error || "No se pudo cancelar"}`, "error");
        
        if (result.error?.includes("no encontrada") || result.error?.includes("finalizada")) {
          setLoading(false);
          setProgreso("");
          setCurrentTaskId(null);
        }
      }
      
    } catch (error) {
      console.error(`Error al cancelar:`, error);
      mostrarSnackbar(" Error al contactar al servidor", "warning");
      setLoading(false);
      setProgreso("");
      setCurrentTaskId(null);
    }
  };

  // Descargar por lote
  const onDescargarPorLote = async (formData) => {
    if (!formData.loteSeleccionado) {
      mostrarSnackbar("Por favor seleccione un lote", "warning");
      return;
    }
    
    const lote = formData.loteSeleccionado;
    await iniciarGeneracionAsync('lote', lote, `${lote}`);
  };

  // Descargar por cliente
  const onDescargarPorCliente = async (formData) => {
    if (!formData.numCliente) {
      mostrarSnackbar("Por favor ingrese un número de cliente", "warning");
      return;
    }
    
    const nroCliente = formData.numCliente;
    setBuscandoCliente(true);
    setProgreso("Buscando acuses...");
    
    try {
      const response = await apiFetch(
          `${API_BACK}/api/acuses/getAcuses?nroCliente=${nroCliente}&idGrupoCliente=${user?.idGrupoCliente}`
      );
      const data = await response.json();
      
      if (data.acusesData?.length > 0) {
        setDataCliente(data.acusesData);
      } else {
        mostrarSnackbar(`No se encontraron acuses`, "info");
      }
    } catch (err) {
      console.error("Error al buscar por cliente:", err);
      mostrarSnackbar("Error al buscar acuses", "error");
    } finally {
      setBuscandoCliente(false);
      setProgreso("");
    }
  };

  const renderizarAcuseAImagen = async (acuseData, nroCliente) => {
    return new Promise((resolve, reject) => {
      const formatearFecha = (date) => {
        if (!date) return "-";
        const partes = date.split(/[-/]/);
        if (partes.length !== 3) return date;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      };

      const formatearHora = (hora) => {
        if (!hora) return "-";
        return hora.slice(0, 5);
      };

      const item = {
        ...acuseData,
        fecha: formatearFecha(acuseData.fecha),
        hora: formatearHora(acuseData.hora),
        fechaEmision: formatearFecha(acuseData.fechaEmision),
        vencimiento: formatearFecha(acuseData.vencimiento),
        segundaVisita: {
          ...acuseData.segundaVisita,
          fecha2: formatearFecha(acuseData.segundaVisita?.fecha2),
          hora2: formatearHora(acuseData.segundaVisita?.hora2),
        },
      };

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
            try {
              const canvas = await html2canvas(refElement, {
                useCORS: true,
                backgroundColor: "#fff",
                scrollY: 0,
                scale: 1.2,
              });

              canvas.toBlob((blob) => {
                if (blob) {
                  root.unmount();
                  document.body.removeChild(contenedor);
                  resolve(blob);
                } else {
                  reject(new Error(`No se pudo generar blob para cliente ${nroCliente}`));
                }
              }, "image/jpeg", 0.5);
              
            } catch (error) {
              console.error(`Error en html2canvas para cliente ${nroCliente}:`, error);
              root.unmount();
              document.body.removeChild(contenedor);
              reject(error);
            }
          }}
        />
      );

      setTimeout(() => {
        try {
          root.unmount();
          document.body.removeChild(contenedor);
        } catch (e) {}
        reject(new Error(`Timeout renderizando cliente ${nroCliente}`));
      }, 30000);
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        mostrarSnackbar("Por favor seleccione un archivo Excel válido (.xlsx, .xls, .csv)", "warning");
        event.target.value = '';
        setExcelFile(null);
        setExcelFileName("");
        return;
      }
      
      setExcelFile(file);
      setExcelFileName(file.name);
    }
  };

  const onDescargarPorExcel = async () => {
    if (!excelFile) {
      mostrarSnackbar("Por favor seleccione un archivo Excel", "warning");
      return;
    }

    setProcesandoExcel(true);
    setRenderizando(true);
    setProgreso("📊 Leyendo archivo Excel...");

    try {
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      if (jsonData.length === 0) {
        throw new Error("El archivo está vacío");
      }

      const nrosClientes = jsonData
        .map(row => row[0])
        .filter(cell => cell !== undefined && cell !== null && cell !== "")
        .map(cell => String(cell).trim())
        .filter((value, index, self) => self.indexOf(value) === index);

      if (nrosClientes.length > 0 && isNaN(nrosClientes[0])) {
        nrosClientes.shift(); 
      }

      if (nrosClientes.length === 0) {
        throw new Error("No se encontraron números de cliente en el archivo");
      }

      if (nrosClientes.length > 100) {
        mostrarSnackbar(`El archivo contiene ${nrosClientes.length} clientes. Se procesarán los primeros 100.`, "warning");
        nrosClientes.length = 100;
      }

      setProgreso(`📦 Procesando ${nrosClientes.length} clientes...`);

      const zip = new JSZip();
      const fecha = new Date().toISOString().split('T')[0];
      const mainFolder = zip.folder(`acuses_multiples_${fecha}`);
      
      const clientesConError = [];
      let procesados = 0;
      let exitosos = 0;

      for (const nroCliente of nrosClientes) {
        procesados++;
        setProgreso(`Procesando cliente ${procesados} de ${nrosClientes.length}: ${nroCliente}`);

        try {
          const response = await apiFetch(
            `${API_BACK}/api/acuses/getAcuses?nroCliente=${nroCliente}&idGrupoCliente=${user?.idGrupoCliente}`
          );
          
          if (!response.ok) {
            throw new Error(`Error en la respuesta del servidor: ${response.status}`);
          }
          
          const result = await response.json();

          if (result.acusesData && result.acusesData.length > 0) {
            const acusesOrdenados = [...result.acusesData].sort((a, b) => {
              const convertirFecha = (fechaStr) => {
                if (!fechaStr) return '0000-00-00';
                const partes = fechaStr.split('/');
                if (partes.length === 3) {
                  return `${partes[2]}-${partes[1]}-${partes[0]}`; 
                }
                return fechaStr;
              };
              
              const fechaA = convertirFecha(a.fechaEmision);
              const fechaB = convertirFecha(b.fechaEmision);
              
              if (fechaA > fechaB) return -1;
              if (fechaA < fechaB) return 1;
              return 0;
            });
            
            const acuseData = acusesOrdenados[0];
            
            setProgreso(`Renderizando acuse para cliente ${nroCliente}...`);
            
            try {
              const imagenBlob = await renderizarAcuseAImagen(acuseData, nroCliente);
              mainFolder.file(`${acuseData.codigoBarras}.jpg`, imagenBlob, { binary: true });
              exitosos++;
            } catch (renderError) {
              console.error(`Error renderizando cliente ${nroCliente}:`, renderError);
              clientesConError.push({
                nroCliente: nroCliente,
                motivo: `Error al generar imagen: ${renderError.message || 'Error desconocido'}`
              });
            }
            
          } else {
            clientesConError.push({
              nroCliente: nroCliente,
              motivo: "No se encontraron acuses para este cliente"
            });
          }

          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`Error procesando cliente ${nroCliente}:`, error);
          clientesConError.push({
            nroCliente: nroCliente,
            motivo: error.message || "Error en la consulta al servidor"
          });
        }
      }

      // Generar CSV con errores si los hay
      if (clientesConError.length > 0) {
        setProgreso(`📝 Generando reporte de errores...`);
        
        const csvContent = [
          ["Nro de Cliente", "Motivo del Error"], 
          ...clientesConError.map(item => [
            `="${item.nroCliente}"`, 
            item.motivo
          ])
        ].map(row => row.join(",")).join("\n");
        
        mainFolder.file("clientes_con_error.csv", csvContent);
      }

      setProgreso(`📥 Generando archivo ZIP...`);

      const zipBlob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      
      saveAs(zipBlob, `acuses_multiples_${fecha}.zip`);

      if (clientesConError.length > 0) {
        mostrarSnackbar(
          `${exitosos} acuses generados\n , ${clientesConError.length} clientes con error - Revisa el CSV dentro del ZIP`,
          "warning"
        );
      } else {
        mostrarSnackbar(
          ` ${exitosos} acuses generados correctamente`,
          "success"
        );
      }

      setExcelFile(null);
      setExcelFileName("");
      document.getElementById('excel-file-input').value = '';

    } catch (error) {
      console.error("Error procesando Excel:", error);
      mostrarSnackbar(`Error: ${error.message}`, "error");
    } finally {
      setProcesandoExcel(false);
      setRenderizando(false);
      setProgreso("");
    }
  };

  // Funcionalidades disponibles dentro de la seccion. Se muestran de a una
  // (ocupando todo el ancho) y se cambia entre ellas con el switch de arriba,
  // en vez de repartirlas lado a lado en columnas angostas.
  const FUNCIONALIDADES = [
    {
      id: "lote",
      label: "Por Lote",
      titulo: "Acuse por Lote",
      descripcion: "Genere acuses para todos los comprobantes de un lote específico",
      icon: InventoryIcon,
      mostrar: user?.userName === "imorales@emaservicios.com.ar",
    },
    {
      id: "cliente",
      label: "Por Cliente",
      titulo: "Acuse por Cliente",
      descripcion: "Busque y visualice los acuses de un cliente específico",
      icon: PersonIcon,
      mostrar: true,
    },
    {
      id: "excel",
      label: "Por Excel",
      titulo: "Acuse por Excel",
      descripcion: "Genere acuses para múltiples clientes desde un archivo Excel",
      icon: DescriptionIcon,
      mostrar: true,
    },
  ].filter((f) => f.mostrar);

  const [funcionalidad, setFuncionalidad] = useState("cliente");
  const funcionalidadActiva = FUNCIONALIDADES.find((f) => f.id === funcionalidad) || FUNCIONALIDADES[0];

  return (
    <>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          elevation={6}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>

    <LoadingModal isOpen={loading || procesandoExcel || renderizando} />

      <SoftBox display="flex" flexDirection="column" alignItems="center" minHeight="100vh">
        <SoftBox width="100%">
          <ResponsiveAppBar />
        </SoftBox>

        {/* CONTENEDOR PRINCIPAL: mismo ancho (90%) que el header y el resto de las pantallas */}
        <SoftBox
          width="90%"
          mt="2rem"
          mb={4}
        >

          {/* Seccion general que agrupa las funcionalidades, mismo estilo (fondo blanco, ancho) que el resto de las pantallas */}
          <Card sx={{ borderRadius: "20px", p: 3 }}>
            {/* Header: nombre + descripcion de la funcionalidad activa a la
                izquierda, switch para cambiar de funcionalidad a la derecha */}
            <SoftBox
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 2,
                mb: 3,
              }}
            >
              <SoftBox>
                <SoftBox display="flex" alignItems="center" mb={0.5}>
                  <funcionalidadActiva.icon sx={{ fontSize: 30, color: COLOR_ICON_ACTIVE, mr: 1.5 }} />
                  <SoftTypography variant="h5" fontWeight="bold">
                    {funcionalidadActiva.titulo}
                  </SoftTypography>
                </SoftBox>
                <SoftTypography variant="body2" color="text.secondary">
                  {funcionalidadActiva.descripcion}
                </SoftTypography>
              </SoftBox>

              <SoftBox
                sx={{
                  display: "inline-flex",
                  backgroundColor: "#f4f6fa",
                  borderRadius: "14px",
                  p: 0.5,
                  gap: 0.5,
                  flexShrink: 0,
                }}
              >
                {FUNCIONALIDADES.map((f) => {
                  const Icon = f.icon;
                  const activo = funcionalidad === f.id;
                  return (
                    <SoftBox
                      key={f.id}
                      component="button"
                      type="button"
                      onClick={() => setFuncionalidad(f.id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        border: "none",
                        cursor: "pointer",
                        px: 2.5,
                        py: 1,
                        borderRadius: "10px",
                        fontFamily: "inherit",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: activo ? "#ffffff" : "#67748e",
                        backgroundColor: activo ? COLOR_ICON_ACTIVE : "transparent",
                        boxShadow: activo ? "0 4px 10px rgba(33, 82, 255, 0.25)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Icon sx={{ fontSize: 18 }} />
                      {f.label}
                    </SoftBox>
                  );
                })}
              </SoftBox>
            </SoftBox>

            <Divider sx={{ mb: 3 }} />

            {/* Contenido de la funcionalidad activa */}
            {funcionalidad === "lote" && FUNCIONALIDADES.some((f) => f.id === "lote") && (
              <SoftBox sx={{ maxWidth: "420px" }}>
                <SoftBox mb={3}>
                  <SoftTypography component="label" variant="caption" fontWeight="medium" color="text.secondary">
                    Seleccionar Lote
                  </SoftTypography>
                  <Controller
                    name="loteSeleccionado"
                    control={control}
                    render={({ field }) => (
                      <SoftBox sx={{ mt: 1 }}>
                        <DropdownList
                          width="100%"
                          list={lotes}
                          placeholder="Seleccione un Lote"
                          campoAMostrar="nombre"
                          campoID="nombre"
                          inputRef={field.ref}
                          value={field.value}
                          onChange={(selectedValue) => field.onChange(selectedValue || "")}
                        />
                      </SoftBox>
                    )}
                  />
                </SoftBox>

                <SoftButton
                  variant="gradient"
                  color="info"
                  onClick={handleSubmit(onDescargarPorLote)}
                  disabled={loading || buscandoCliente || procesandoExcel}
                  sx={{ minWidth: '140px', py: 1.5 }}
                >
                  {loading ? "Procesando..." : "Generar"}
                </SoftButton>
              </SoftBox>
            )}

            {funcionalidad === "cliente" && (
              <SoftBox sx={{ maxWidth: "420px" }}>
                <form onSubmit={handleSubmit(onDescargarPorCliente)}>
                  <SoftBox mb={3}>
                    <SoftTypography component="label" variant="caption" fontWeight="medium" color="text.secondary">
                      Número de Cliente
                    </SoftTypography>
                    <Controller
                      name="numCliente"
                      control={control}
                      render={({ field }) => (
                        <SoftBox sx={{ mt: 1 }}>
                          <SoftInputBase
                            field={field}
                            placeholder="Ej: 12345"
                            autoComplete="off"
                            fullWidth
                          />
                        </SoftBox>
                      )}
                    />
                  </SoftBox>

                  <SoftButton
                    variant="gradient"
                    color="info"
                    type="submit"
                    disabled={buscandoCliente || loading || procesandoExcel}
                    sx={{ minWidth: '140px', py: 1.5 }}
                  >
                    {buscandoCliente ? "Buscando..." : "Filtrar"}
                  </SoftButton>
                </form>
              </SoftBox>
            )}

            {funcionalidad === "excel" && (
              <SoftBox sx={{ maxWidth: "420px" }}>
                <SoftBox mb={3}>
                  <SoftTypography component="label" variant="caption" fontWeight="medium" color="text.secondary">
                    Archivo Excel
                  </SoftTypography>

                  <SoftBox
                    sx={{
                      border: '2px dashed',
                      borderColor: excelFile ? COLOR_ICON_ACTIVE : '#e0e0e0',
                      borderRadius: 2,
                      p: 2,
                      mt: 1,
                      textAlign: 'center',
                      backgroundColor: excelFile ? 'rgba(33, 82, 255, 0.04)' : '#f8f9fa',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: COLOR_ICON_ACTIVE,
                        backgroundColor: 'rgba(33, 82, 255, 0.04)',
                      }
                    }}
                    onClick={() => document.getElementById('excel-file-input').click()}
                  >
                    <input
                      type="file"
                      id="excel-file-input"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <CloudUploadIcon sx={{
                      fontSize: 40,
                      color: excelFile ? COLOR_ICON_ACTIVE : '#9e9e9e',
                      mb: 0.5
                    }} />
                    <SoftTypography
                      variant="body2"
                      color={excelFile ? 'info' : 'text.secondary'}
                      fontWeight={excelFile ? 'medium' : 'regular'}
                    >
                      {excelFileName || "Haga clic para seleccionar archivo"}
                    </SoftTypography>
                    <SoftTypography variant="body2" color="text.secondary" display="block" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                      Formatos: .xlsx, .xls, .csv (máx. 100 clientes)
                    </SoftTypography>
                    {excelFile && (
                      <SoftTypography variant="caption" color="info" display="block" sx={{ mt: 1 }}>
                        ✓ Archivo listo para procesar
                      </SoftTypography>
                    )}
                  </SoftBox>

                  <SoftTypography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5, fontSize: '0.75rem' }}>
                    El archivo debe tener los números de cliente en la primera columna
                  </SoftTypography>
                </SoftBox>

                <SoftButton
                  variant="gradient"
                  color="info"
                  onClick={onDescargarPorExcel}
                  disabled={!excelFile || procesandoExcel || loading || buscandoCliente}
                  startIcon={<CloudUploadIcon />}
                  sx={{ minWidth: '160px', py: 1.5 }}
                >
                  {procesandoExcel ? "Procesando..." : "Generar ZIP"}
                </SoftButton>
              </SoftBox>
            )}
          </Card>

          {/* Tabla de resultados: solo mientras la funcionalidad activa siga
              siendo "Por Cliente" (al cambiar de funcionalidad se oculta) */}
          {funcionalidad === "cliente" && dataCliente.length > 0 && (
            <SoftBox mt={4}>
              <Card sx={{ p: 3, borderRadius: 5 }}>
                <SoftBox px={1}>
                  <SoftTypography variant="body2" color="text.secondary">
                    Se encontraron {dataCliente.length} acuses para el cliente
                  </SoftTypography>
                </SoftBox>
                <TablaAcusesCliente data={dataCliente} setRenderizando={setRenderizando} />
              </Card>
            </SoftBox>
          )}
        </SoftBox>

        <Footer />
      </SoftBox>
    </>
  );
};

export default AcuseCliente;