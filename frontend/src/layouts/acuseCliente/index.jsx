// ✅ AcuseCliente.jsx

import { React, useEffect, useState, useCallback } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Alert as MuiAlert, Snackbar } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "layouts/auth/AuthContext";
import { API_BACK } from "../../config";
import DropdownList from "components/DropdownList";
import { saveAs } from "file-saver";
import TablaAcusesCliente from "./data/tablaAcusesCliente.jsx";
import SoftInputBase from "components/SoftInputBase";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';

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
  const [pollingActive, setPollingActive] = useState(true);
  const { user } = useAuth();

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
      }
    };
    fetchLotes();
  }, []);

  // Obtener tareas activas
  const obtenerTareasActivas = useCallback(async () => {
    try {
      const response = await fetch(`${API_BACK}/api/acuses-async/active-tasks`);
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
    // VERIFICAR PRIMERO si ya hay una generación en curso
    try {
      const checkResponse = await fetch(`${API_BACK}/api/acuses-async/can-generate`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (!checkData.can_generate) {
          // Ya hay una generación en curso
          mostrarSnackbar("Ya hay una generación de acuses en curso. Espere a que termine.", "warning");
          return; // Salir sin hacer nada
        }
      }
    } catch (checkError) {
      console.error("Error verificando estado:", checkError);
      // Continuar de todos modos si falla la verificación
    }
    
    setLoading(true);
    setProgreso("⏳ Iniciando generación...");
    setCurrentTaskId(null);
    
    try {
      const requestData = tipo === 'lote' 
        ? { lote: valor }
        : { nroCliente: valor };
      
      const response = await fetch(`${API_BACK}/api/acuses-async/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (!result.success) {
        // Manejar específicamente el error de "ya hay generación"
        if (result.error && (
            result.error.includes("Ya hay una generación") ||
            result.error.includes("generación en curso") ||
            result.status === 423  // Locked
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

  // Monitorear tarea - CON LOGS
  const monitorearTarea = async (taskId, nombreDescarga) => {
    let attempts = 0;
    const maxAttempts = 4500;
    let shouldContinuePolling = true;
    let pollingActive = true;
    let cancelledDetected = false;
    setPollingActive(true);
    
    while (pollingActive && attempts < maxAttempts && !cancelledDetected) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await fetch(`${API_BACK}/api/acuses-async/status/${taskId}`);
        const status = await statusResponse.json();
        
        if (!status.success) {
          if (status.status === "expired" || status.status === "gone") {
            mostrarSnackbar("La tarea ya no está disponible", "info");
            pollingActive = false;
            setLoading(false); 
            setProgreso("");
            break;
          }
          throw new Error(status.error || 'Error al verificar estado');
        }
        
        // Actualizar progreso
        if (status.status === 'processing') {
          const newMessage = status.message;
          setProgreso(newMessage);
        }
        
        // MANEJAR ESTADO CANCELADO
        if (status.status === 'cancelled' || status.cancelled) {
          cancelledDetected = true;
          mostrarSnackbar("Generación cancelada", "info");
          setProgreso("Cancelada");
          setLoading(false);
          setCurrentTaskId(null);
          setPollingActive(false);
          pollingActive = false;
          break; 
        } else if (status.status === 'completed') {
            
            // Descargar el ZIP primero
            await descargarResultado(taskId, nombreDescarga);
            
            // Mostrar estadísticas
            const totalGenerados = status.total_generados || 0;
            const totalErrores = status.total_con_errores || 0;
            
            // DESCARGAR AUTOMÁTICAMENTE REPORTE SI HAY ERRORES
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
          setCurrentTaskId(null);
          throw new Error(status.error || 'La generación falló');
        } else if (status.status === 'pending') {
          console.log(` [monitorearTarea] Tarea PENDIENTE - continuando...`);
        }
        
      } catch (error) {
        console.error(` [monitorearTarea] Error en intento ${attempts + 1}:`, error);
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
      const downloadResponse = await fetch(`${API_BACK}/api/acuses-async/download/${taskId}`);
      
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
      
      const response = await fetch(url, {
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
        
        setTimeout(() => {
          setLoading(false);
          setProgreso("");
        }, 100);
        
      } else {
        mostrarSnackbar(` Error: ${result.error || "No se pudo cancelar"}`, "error");
        
        if (result.error?.includes("no encontrada") || result.error?.includes("finalizada")) {
          setLoading(false);
          setProgreso("");
          setCurrentTaskId(null);
        }
      }
      
    } catch (error) {
      console.error(`[cancelarTarea] Error de red o servidor:`, error);
      
      mostrarSnackbar(" Error al contactar al servidor", "warning");
      
      setLoading(false);
      setProgreso("");
      setCurrentTaskId(null);
      
      try {
        await obtenerTareasActivas();
      } catch (e) {
        console.error("Error al actualizar tareas activas:", e);
      }
    }
  };

  const verificarSiPuedeGenerar = async () => {
    try {
      const response = await fetch(`${API_BACK}/api/acuses-async/can-generate`);
      if (response.ok) {
        const data = await response.json();
        return data.can_generate;
      }
    } catch (error) {
      console.error("Error verificando:", error);
    }
    return true; 
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
    setProgreso("🔍 Buscando acuses...");
    
    try {
      const response = await fetch(
        `${API_BACK}/api/acuses/getAcuses?nroCliente=${nroCliente}`
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

  return (
    <>
      {/* Snackbar para notificaciones */}
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

      {/* Overlay de carga TRANSPARENTE - NO mueve elementos */}
      {loading && (
        <SoftBox 
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(39, 39, 39, 0.82)', 
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '20vh', 
          }}
        >
          {/* Tarjeta de progreso CENTRADA - NO afecta al layout debajo */}
          <Card sx={{ 
            width: '90%',
            maxWidth: '500px',
            p: 4,
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e0e0e0',
            backgroundColor: 'white',
            position: 'relative',
            zIndex: 1001,
          }}>
            <SoftBox display="flex" flexDirection="column" alignItems="center" gap={3}>
              <CircularProgress size={60} thickness={4} color="info" />
              
              <SoftBox textAlign="center">
                <SoftTypography variant="h5" fontWeight="bold" color="info" gutterBottom>
                   Generando Acuses
                </SoftTypography>
                <SoftTypography variant="body1" color="text.secondary">
                  {progreso || "Procesando en segundo plano..."}
                </SoftTypography>
              </SoftBox>
              
              <SoftBox width="100%">
                <SoftTypography variant="caption" color="text.secondary" display="block" textAlign="center">
                  La descarga comenzará automáticamente
                </SoftTypography>
              </SoftBox>             
                <SoftButton
                  variant="gradient"
                  color="info"
                  size="small"
                  onClick={() => {
                    
                    // Opción 1: Si tenemos currentTaskId
                    if (currentTaskId) {
                      setLoading(false);
                      setProgreso("");
                      setCurrentTaskId(null);
                      
                      // Luego enviar cancelación al backend
                      cancelarTarea(currentTaskId);
                    } 
                    // Opción 2: Buscar en activeTasks
                    else if (activeTasks.length > 0) {
                      const taskToCancel = activeTasks[0]; 
                      if (taskToCancel) {
                        setLoading(false);
                        setProgreso("");
                        setCurrentTaskId(null);
                        cancelarTarea(taskToCancel.task_id);
                      }
                    } 
                    // Opción 3: Solo limpiar UI
                    else {
                      setLoading(false);
                      setProgreso("");
                      setCurrentTaskId(null);
                      mostrarSnackbar("Operación cancelada", "info");
                    }
                  }}
                  startIcon={<CloseIcon />}
                >
                  Cancelar
                </SoftButton>
            </SoftBox>
          </Card>
        </SoftBox>
      )}

      {/* CONTENIDO PRINCIPAL - Este NO se mueve */}
      <SoftBox display="flex" flexDirection="column" alignItems="center">
        <SoftBox width="100%">
          <ResponsiveAppBar />
        </SoftBox>

        {/* Cards de selección - SIEMPRE en su posición */}
        <SoftBox
          display="flex"
          justifyContent={
            user?.userName === "imorales@emaservicios.com.ar" ? "space-between" : "flex-start"
          }
          flexWrap="wrap"
          gap={2}
          mt={{ xs: '6rem', md: '8rem' }}
          width="96%"
          px={2}
        >
          {/* Card Selección de Lote */}
          {user?.userName === "imorales@emaservicios.com.ar" && (
            <Card
              sx={{
                width: { xs: "100%", md: "48%" },
                p: 4,
                boxShadow: 3,
                borderRadius: 2,
              }}
            >
              <SoftTypography variant="h5" fontWeight="bold" mb={1}>
                Acuse por Lote
              </SoftTypography>
              <SoftBox
                display="flex"
                flexDirection={{ xs: "column", sm: "row" }}
                gap={2}
                alignItems="flex-end"
              >
                <SoftBox flex={1}>
                  <SoftTypography component="label" variant="caption" fontWeight="medium" >
                    Lote:
                  </SoftTypography>
                  <Controller
                    name="loteSeleccionado"
                    control={control}
                    render={({ field }) => (
                      <DropdownList
                        list={lotes}
                        width="30vw"
                        campoAMostrar="nombre"
                        campoID="nombre"
                        placeholder="Seleccione un Lote"
                        {...field}
                      />
                    )}
                  />
                </SoftBox>
                <SoftButton
                  sx={{ mt: { xs: 2, sm: 0 }, minWidth: '120px' }}
                  variant="gradient"
                  color="info"
                  onClick={handleSubmit(onDescargarPorLote)}
                  disabled={loading || buscandoCliente}
                >
                  {loading ? "PROCESANDO..." : "FILTRAR"}
                </SoftButton>
              </SoftBox>
            </Card>
          )}

          {/* Card Acuse por N° Cliente */}
          <Card
            sx={{
              width: { xs: "100%", md: user?.userName === "imorales@emaservicios.com.ar" ? "48%" : "100%" },
              p: 4,
              boxShadow: 3,
              borderRadius: 2,
            }}
          >
            <SoftTypography variant="h5" fontWeight="bold" mb={1}>
              Acuse por N° Cliente
            </SoftTypography>
            <form onSubmit={handleSubmit(onDescargarPorCliente)}>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
                flexDirection={{ xs: "column", md: "row" }}
                gap={2}
              >
                <SoftBox flex={1}>
                  <SoftTypography component="label" variant="caption" fontWeight="medium">
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
                        fullWidth
                      />
                    )}
                  />
                </SoftBox>
                <SoftBox alignSelf={{ xs: "stretch", md: "flex-end" }}>
                  <SoftButton 
                    variant="gradient" 
                    color="info" 
                    type="submit"
                    disabled={buscandoCliente || loading}
                    fullWidth={window.innerWidth < 900}
                  >
                    {buscandoCliente ? "BUSCANDO..." : "FILTRAR"}
                  </SoftButton>
                </SoftBox>
              </SoftBox>
            </form>
          </Card>
        </SoftBox>

        {/* Tabla resultado búsqueda por cliente */}
        {dataCliente.length > 0 && (
          <SoftBox width="96%" mt={3} px={2} mb={4}>
            <Card sx={{ p: 2, borderRadius: 2 }}>
              <TablaAcusesCliente data={dataCliente} />
            </Card>
          </SoftBox>
        )}
      </SoftBox>
    </>
  );
};

export default AcuseCliente;