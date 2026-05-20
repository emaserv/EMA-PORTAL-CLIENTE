import * as React from "react";
import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import { Tooltip } from "@mui/material";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Toolbar from "@mui/material/Toolbar";
import Paper from "@mui/material/Paper";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftProgress from "components/SoftProgress";
import { HiChevronUp, HiChevronDown } from "react-icons/hi";
import dayjs from "dayjs";
import PhotoIcon from "@mui/icons-material/Photo";
import MapIcon from "@mui/icons-material/Map";
import Edit from "@mui/icons-material/Edit";
import ArticleIcon from "@mui/icons-material/Article";
import MobileFriendlyTooltip from "components/TooltipMobile";
import axios from "axios";
import { useAuth } from "layouts/auth/AuthContext";
import html2canvas from "html2canvas";
import ReactDOM from "react-dom/client";
import AcuseReciboConFirma from "./acuseConFirma.js";
import {API_BACK} from '../../../config.js'


dayjs.locale("ES");

const toDate = (dayjsObject) =>
  new Date(dayjsObject.year(), dayjsObject.month(), dayjsObject.date());
const todayGMT3 = dayjs().subtract(3, "hour");

// Funciones de formateo
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

export default function CalleAlturaTable({ data, columns }) {
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("cantidadDePiezas");
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);
  const { user } = useAuth();
  
  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split("/");
    return new Date(year, month - 1, day);
  };

  const filterByDateRange = (item, startDate, endDate) => {
    if (!startDate && !endDate) return true;

    const itemDate = parseDate(item.fechaIngreso);
    if (startDate && !endDate) {
      return itemDate >= toDate(startDate);
    } else if (!startDate && endDate) {
      return itemDate <= toDate(endDate);
    } else {
      return itemDate >= toDate(startDate) && itemDate <= toDate(endDate);
    }
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter((selectedId) => selectedId !== id);
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  const descendingComparator = (a, b, orderBy) => {
    const valueA = isNaN(parseFloat(a[orderBy]))
      ? a[orderBy]
      : parseFloat(a[orderBy]);
    const valueB = isNaN(parseFloat(b[orderBy]))
      ? b[orderBy]
      : parseFloat(b[orderBy]);

    if (valueB < valueA) return -1;
    if (valueB > valueA) return 1;
    return 0;
  };

  const getComparator = (order, orderBy) => {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

const abrirAcuseEnNuevaPestaniaConCanvas = async (itemOriginal) => {
  
  const nroCliente = itemOriginal.nroCliente;
  const idGrupoCliente = user?.idGrupoCliente;
  let fechaEmision = itemOriginal.fechaEmision; // Fecha de la fila seleccionada (ej: 06/05/26)
  
  if (!nroCliente) {
    console.error("No se encontró nroCliente");
    alert("No se puede generar el acuse: falta número de cliente");
    return;
  }
  
  // Normalizar fecha: convertir 06/05/26 a 06/05/2026
  if (fechaEmision && fechaEmision.split('/')[2]?.length === 2) {
    const partes = fechaEmision.split('/');
    const añoCompleto = 2000 + parseInt(partes[2]);
    fechaEmision = `${partes[0]}/${partes[1]}/${añoCompleto}`;
  }
  
  const loadingWindow = window.open();
  if (loadingWindow) {
    loadingWindow.document.write(`
      <html>
        <head>
          <title>Cargando...</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              font-family: Arial, sans-serif;
            }
            .loader {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #2152ff;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div style="text-align: center">
            <div class="loader"></div>
            <p>Obteniendo datos del acuse...</p>
          </div>
        </body>
      </html>
    `);
    loadingWindow.document.close();
  }
  
  try {
    const response = await fetch(
      `${API_BACK}/api/acuses/getAcuses?nroCliente=${nroCliente}&idGrupoCliente=${idGrupoCliente}`
    );
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    const acusesData = result.acusesData || result;
    
    // Buscar el acuse que coincide con la fecha de emisión normalizada
    let acuseData = Array.isArray(acusesData) 
      ? acusesData.find(acuse => acuse.fechaEmision === fechaEmision)
      : null;
    
    // Si no encuentra, intentar comparar solo día y mes
    if (!acuseData && fechaEmision) {
      const fechaFilaDM = fechaEmision.split('/').slice(0, 2).join('/');
      acuseData = acusesData.find(acuse => {
        const fechaAcuseDM = acuse.fechaEmision.split('/').slice(0, 2).join('/');
        return fechaFilaDM === fechaAcuseDM;
      });
    }
    
    if (!acuseData) {
      alert(`No se encontraron datos de acuse para la fecha ${fechaEmision}`);
      if (loadingWindow) loadingWindow.close();
      return;
    }
    
    if (loadingWindow) loadingWindow.close();
    
    const item = {
      nroCliente: acuseData.nroCliente || "-",
      nombreCliente: acuseData.nombreCliente || "-",
      medidor: acuseData.medidor || "-",
      direccion: acuseData.direccion || "-",
      entreCalle: acuseData.entreCalle || "",
      codigoPostal: acuseData.codigoPostal || "-",
      importe: acuseData.importe || "0",
      comprobante: acuseData.comprobante || "-",
      tipoEntrega: acuseData.tipoEntrega || "",
      referencia1: acuseData.referencia1 || "",
      referencia2: acuseData.referencia2 || "",
      referencia3: acuseData.referencia3 || "",
      geo: acuseData.geo || null,
      foto: acuseData.foto || null,
      firma: acuseData.firma || null,
      codigoBarras: acuseData.codigoBarras || "000000",
      distribuidor: acuseData.distribuidor || "",
      dni: acuseData.dni || "",
      aclaracion: acuseData.aclaracion || "",
      vinculo: acuseData.vinculo || "",
      descripcion: acuseData.descripcion || "",
      fechaEmision: acuseData.fechaEmision || "-",
      vencimiento: acuseData.vencimiento || "-",
      fecha: acuseData.fecha || "-",
      hora: acuseData.hora || "-",
      segundaVisita: acuseData.segundaVisita || {},
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
          
          if (!refElement) {
            console.error("refElement es null");
            root.unmount();
            document.body.removeChild(contenedor);
            return;
          }
          
          try {
            const canvas = await html2canvas(refElement, {
              useCORS: true,
              backgroundColor: "#fff",
              scrollY: 0,
              scale: 1.2,
              logging: true,
            });

            canvas.toBlob((blob) => {
              if (!blob) {
                console.error("No se pudo generar el blob");
                return;
              }
              
              const urlDescarga = URL.createObjectURL(blob);
              const reader = new FileReader();

              reader.onloadend = () => {
                const dataUrl = reader.result;

                const nuevaVentana = window.open();
                if (nuevaVentana) {
                  nuevaVentana.document.write(`
                    <html>
                      <head>
                        <title>Acuse de Recibo</title>
                        <meta charset="UTF-8">
                        <style>
                          body {
                            margin: 0;
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: flex-start;
                            background-color: #f0f2f5;
                            padding: 20px;
                          }
                          .boton-descargar {
                            margin: 20px auto;
                            padding: 12px 24px;
                            background: linear-gradient(135deg, #2152ff, #21d4fd);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                            text-decoration: none;
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            transition: all 0.3s ease;
                          }
                          .boton-descargar:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(33, 82, 255, 0.3);
                          }
                          .contenido-img {
                            display: flex;
                            justify-content: center;
                            width: 100%;
                            max-width: 1000px;
                          }
                          img {
                            max-width: 100%;
                            height: auto;
                            border-radius: 8px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                          }
                          @media print {
                            .boton-descargar {
                              display: none;
                            }
                            body {
                              background: white;
                              padding: 0;
                            }
                          }
                        </style>
                      </head>
                      <body>
                        <a href="${urlDescarga}" download="acuse_${item.codigoBarras}.jpg" class="boton-descargar">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.34v4h4.66v-4h3.34L12 2z"/>
                          </svg>
                          Descargar JPG
                        </a>
                        <div class="contenido-img">
                          <img src="${dataUrl}" alt="Acuse de Recibo" />
                        </div>
                      </body>
                    </html>
                  `);
                  nuevaVentana.document.close();
                } else {
                  alert("Por favor, permita ventanas emergentes para esta página");
                }
              };
              
              reader.onerror = (error) => {
                console.error("Error leyendo el blob:", error);
              };
              
              reader.readAsDataURL(blob);
            }, "image/jpeg", 0.8);

          } catch (error) {
            console.error("Error al generar canvas:", error);
            alert("Error al generar el acuse. Verifique la consola para más detalles.");
          } finally {
            setTimeout(() => {
              root.unmount();
              document.body.removeChild(contenedor);
            }, 1000);
          }
        }}
      />
    );
    
  } catch (error) {
    console.error("Error al obtener datos del acuse:", error);
    alert("Error al obtener los datos del acuse. Por favor, intente nuevamente.");
    if (loadingWindow) loadingWindow.close();
  }
};

  // Determinar qué columnas mostrar según el grupo del usuario
  const headCells = [
    {
      id: "fechaEmision",
      numeric: false,
      disablePadding: false,
      label: "F. Emision",
      labelComplete: "Fecha de Emision",
    },
    // Condicionalmente mostrar fechaVencimiento solo si NO es grupo 6
    ...(user?.idGrupoCliente !== 6 ? [{
      id: "fechaVencimiento",
      numeric: false,
      disablePadding: false,
      label: "F. Vencimiento",
      labelComplete: "Fecha de Vencimiento",
    }] : []),
    {
      id: "nroCliente",
      numeric: false,
      disablePadding: false,
      label: "Nro. Cliente",
      labelComplete: "Numero de Cliente",
    },
    {
      id: "titular",
      numeric: false,
      disablePadding: false,
      label: "Titular",
      labelComplete: "Titular",
    },
    {
      id: "direccion",
      numeric: false,
      disablePadding: false,
      label: "Direccion",
      labelComplete: "Direccion",
    },
    {
      id: "localidad",
      numeric: false,
      disablePadding: false,
      label: "Localidad",
      labelComplete: "Localidad",
    },
    {
      id: "fecha",
      numeric: false,
      disablePadding: false,
      label: "F. Dist.",
      labelComplete: "Fecha de Distribucion",
    },
    {
      id: "hora",
      numeric: false,
      disablePadding: false,
      label: "Hora",
      labelComplete: "Hora",
    },
    {
      id: "importe",
      numeric: false,
      disablePadding: false,
      label: "Importe",
      labelComplete: "Importe",
    },
    ...(user?.idGrupoCliente === 6 ? [{
      id: "comprobante",
      numeric: false,
      disablePadding: false,
      label: "Comprobante",
      labelComplete: "Comprobante",
    }] : []),
    {
      id: "estadoPieza",
      numeric: false,
      disablePadding: false,
      label: "Est E.",
      labelComplete: "Estado EMA",
    },
    {
      id: "obsVisita",
      numeric: false,
      disablePadding: false,
      label: "Obs. Visita",
      labelComplete: "Observacion de Visita",
    },
    {
      id: "geoVisita",
      numeric: false,
      disablePadding: false,
      label: "V.",
      labelComplete: "Geoposicion de Visita",
    },
    {
      id: "foto",
      numeric: false,
      disablePadding: false,
      label: "Foto",
      labelComplete: "Foto",
    },
    {
      id: "firma",
      numeric: false,
      disablePadding: false,
      label: "Firma",
      labelComplete: "Firma",
    },
    // Condicionalmente mostrar imagenAD solo si NO es grupo 6
    ...(user?.idGrupoCliente !== 6 ? [{
      id: "imagenAD",
      numeric: false,
      disablePadding: false,
      label: "Im. AD",
      labelComplete: "Imagen Aviso Deuda",
    }] : []),
    // Agregar columna acuse solo para grupo 4
    ...(user?.idGrupoCliente === 4 ? [{
      id: "acuse",
      numeric: false,
      disablePadding: false,
      label: "ACUSE",
      labelComplete: "Acuse",
    }] : []),
  ];

  function Completion({ value, color }) {
    return (
      <SoftBox display="flex" alignItems="center">
        <SoftTypography variant="caption" color="text" fontWeight="medium">
          {value}%&nbsp;
        </SoftTypography>
        <SoftBox width="8rem">
          <SoftProgress
            value={value}
            color={color}
            variant="gradient"
            label={false}
          />
        </SoftBox>
      </SoftBox>
    );
  }

  Completion.propTypes = {
    value: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired,
  };

  function EnhancedTableHead(props) {
    const {
      onSelectAllClick,
      order,
      orderBy,
      numSelected,
      rowCount,
      onRequestSort,
    } = props;
    const createSortHandler = (property) => (event) => {
      onRequestSort(event, property);
    };
    const ascendingIcon = (
      <HiChevronUp style={{ marginLeft: "5px", strokeWidth: "2" }} />
    );
    const descendingIcon = (
      <HiChevronDown style={{ marginLeft: "5px", strokeWidth: "2" }} />
    );

    return (
      <TableHead style={{ height: "40px" }}>
        <TableRow
          style={{
            background: "linear-gradient(to top, #2152ff, #21d4fd)",
            borderRadius: "10 px",
            minWidth: "auto",
            fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
            fontSize: "0.3rem",
            opacity: 1,
            cursor: "pointer",
            fontWeight: "500",
            color: "#ffffff",
            textTransform: "uppercase",
            padding: "0px",
            paddingLeft: "16px",
          }}
        >
          {headCells.map((headCell) => (
            <TableCell
              key={headCell.id}
              align={headCell.numeric ? "right" : "left"}
              padding={headCell.disablePadding ? "none" : "normal"}
              sortDirection={orderBy === headCell.id ? order : false}
              sx={{
                background: "linear-gradient(to top, #2152ff, #21d4fd)",
                borderRadius: "1px",
                minWidth: "auto",
                fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                fontSize: "0.85rem",
                opacity: 1,
                cursor: "pointer",
                fontWeight: "700",
                color: "#ffffff",
                textTransform: "uppercase",
                padding: "0px",
                paddingLeft: "10px",
              }}
              selected={numSelected > 0 && orderBy === headCell.id}
              onClick={createSortHandler(headCell.id)}
            >
              <Tooltip title={headCell.labelComplete ? headCell.labelComplete : 'Sin información'}>
                <span>{headCell.label}</span>
              </Tooltip>
              {orderBy === headCell.id &&
                (order == "asc" ? ascendingIcon : descendingIcon)}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    );
  }

  EnhancedTableHead.propTypes = {
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.oneOf(["asc", "desc"]).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
    control: PropTypes.object.isRequired,
  };

  function EnhancedTableToolbar({
    numSelected,
    startDate,
    endDate,
    setEndDate,
    setStartDate,
  }) {
    return null;
  }

  EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    setEndDate: PropTypes.func.isRequired,
    setStartDate: PropTypes.func.isRequired,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
  };

  // Función para truncar texto
  const truncarTexto = (texto, limite) => {
    if (!texto || typeof texto !== 'string') {
      return '';
    }
  
    if (texto.length > limite) {
      return texto.substring(0, limite) + '...';
    }
    return texto;
  };
    
  const visibleRows = React.useMemo(
    () =>
      data
        .filter((item) => filterByDateRange(item, startDate, endDate))
        .sort((a, b) =>
          order === "asc" ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy]
        )
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [data, order, orderBy, page, rowsPerPage, startDate, endDate]
  );

  // Función para verificar si una columna debe mostrarse
  const shouldShowColumn = (column) => {
    if (column === "fechaVencimiento" && user?.idGrupoCliente === 6) return false;
    if (column === "imagenAD" && user?.idGrupoCliente === 6) return false;
    return true;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ width: "100%", mb: 2 }}>
        <EnhancedTableToolbar
          numSelected={selected.length}
          setStartDate={handleStartDateChange}
          setEndDate={handleEndDateChange}
          startDate={startDate}
          endDate={endDate}
        />
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size={dense ? "small" : "medium"}
          >
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={data.length}
            />
            <TableBody>
              {visibleRows.map((row, index) => {
                const isItemSelected = isSelected(row.id);
                const labelId = `enhanced-table-checkbox-${index}`;
                const rowKey = `${row.id}-${index}`;

                return (
                  <>
                    {row.estadoPieza !== "BM" ? (
                      <TableRow
                        key={`${rowKey}`}
                        hover
                        tabIndex={-1}
                      >
                        {/* Renderizado de columnas dinámicas */}
                        {headCells.map((headCell) => {
                          const column = headCell.id;
                          
                          // Si la columna no debe mostrarse por la condición del grupo
                          if (!shouldShowColumn(column)) {
                            return null;
                          }

                          // Para la columna comprobante - mostrar como texto normal
                          if (column === "comprobante") {
                            return (
                              <TableCell
                                key={`${row.id}-${column}-${index}`}
                                align="left"
                                sx={{
                                  fontSize: "0.875rem",
                                  paddingTop: "2px",
                                  paddingBottom: "2px",
                                }}
                              >
                                <MobileFriendlyTooltip title={row[column] ? String(row[column]) : 'Sin información'}>
                                  <span>{truncarTexto(String(row[column] || ''), 12)}</span>
                                </MobileFriendlyTooltip>
                              </TableCell>
                            );
                          }

                          // Columna acuse para grupo 4
                          if (column === "acuse") {
                            return (
                              <TableCell
                                key={`${row.id}-${column}`}
                                sx={{
                                  paddingTop: "2px",
                                  paddingBottom: "0px",
                                }}
                              >
                                <button
                                  style={{ background: "none", border: "none", cursor: "pointer" }}
                                  onClick={() => {
                                    abrirAcuseEnNuevaPestaniaConCanvas(row);
                                  }}
                                >
                                  <ArticleIcon sx={{ color: "#4682B4" }} fontSize="medium" />
                                </button>
                              </TableCell>
                            );
                          }

                          // Para columnas que son iconos
                          if (column === "geoVisita") {
                            return (
                              <TableCell
                                key={`${row.id}-${column}`}
                                sx={{
                                  paddingTop: "2px",
                                  paddingBottom: "0px",
                                  paddingLeft: "0",
                                }}
                              >
                                <a
                                  href={row.geoVisita ? row.geoVisita : "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    textDecoration: "none",
                                    color: row.geoVisita ? "#4682B4" : "#D3D3D3",
                                  }}
                                >
                                  <MapIcon fontSize="medium" />
                                </a>
                              </TableCell>
                            );
                          }

                          if (column === "foto") {
                            return (
                              <TableCell
                                key={`${row.id}-${column}`}
                                sx={{
                                  paddingTop: "2px",
                                  paddingBottom: "0px",
                                }}
                              >
                                <a
                                  href={row.foto ? row.foto : "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    textDecoration: "none",
                                    color: row.foto ? "#4682B4" : "#D3D3D3",
                                  }}
                                >
                                  <PhotoIcon fontSize="medium" />
                                </a>
                              </TableCell>
                            );
                          }

                          if (column === "firma") {
                            return (
                              <TableCell
                                key={`${row.id}-${column}`}
                                sx={{
                                  paddingTop: "2px",
                                  paddingBottom: "0px",
                                }}
                              >
                                <a
                                  href={row.firma !== '-' ? row.firma : "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    textDecoration: "none",
                                    color: row.firma !== '-' ? "#4682B4" : "#D3D3D3",
                                    pointerEvents: row.firma !== '-' ? "auto" : "none",
                                    cursor: row.firma !== '-' ? "pointer" : "not-allowed",
                                  }}
                                >
                                  <Edit fontSize="medium" />
                                </a>
                              </TableCell>
                            );
                          }

                          if (column === "acuseDeDeuda") {
                            return (
                              <TableCell
                                key={`${row.id}-${column}`}
                                sx={{
                                  paddingTop: "2px",
                                  paddingBottom: "0px",
                                }}
                              >
                                <a
                                  href={row.acuseDeDeuda !== '-' ? row.acuseDeDeuda : "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    textDecoration: "none",
                                    color: row.acuseDeDeuda !== '-' ? "#4682B4" : "#D3D3D3",
                                    pointerEvents: row.acuseDeDeuda !== '-' ? "auto" : "none",
                                    cursor: row.acuseDeDeuda !== '-' ? "pointer" : "not-allowed",
                                  }}
                                >
                                  <ArticleIcon fontSize="medium" />
                                </a>
                              </TableCell>
                            );
                          }

                          if (column === "imagenAD") {
                            return (
                              <TableCell
                                key={`${row.id}-${column}`}
                                sx={{
                                  paddingTop: "2px",
                                  paddingBottom: "0px",
                                }}
                              >
                                <a
                                  href={row.acuseDeDeuda !== '-' ? row.acuseDeDeuda : "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    textDecoration: "none",
                                    color: row.acuseDeDeuda !== '-' ? "#4682B4" : "#D3D3D3",
                                    pointerEvents: row.acuseDeDeuda !== '-' ? "auto" : "none",
                                    cursor: row.acuseDeDeuda !== '-' ? "pointer" : "not-allowed",
                                  }}
                                >
                                  <ArticleIcon fontSize="medium" />
                                </a>
                              </TableCell>
                            );
                          }

                          // Para todas las demás columnas (incluyendo porcentaje)
                          return (
                            <TableCell
                              key={`${row.id}-${column}-${index}`}
                              align="left"
                              sx={{
                                fontSize: "0.875rem",
                                paddingTop: "2px",
                                paddingBottom: "2px",
                              }}
                            >
                              {column !== "porcentaje" ? (
                                <MobileFriendlyTooltip title={row[column] ? String(row[column]) : 'Sin información'}>
                                  <span>{truncarTexto(String(row[column] || ''), 12)}</span>
                                </MobileFriendlyTooltip>
                              ) : (
                                <Completion
                                  value={row[column]}
                                  color="info"
                                />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ) : null}
                  </>
                );
              })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: (dense ? 33 : 53) * emptyRows,
                  }}
                >
                  <TableCell colSpan={headCells.length} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginRight: "10vh",
          }}
        />
      </Paper>
    </Box>
  );
}

CalleAlturaTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  control: PropTypes.object.isRequired,
};