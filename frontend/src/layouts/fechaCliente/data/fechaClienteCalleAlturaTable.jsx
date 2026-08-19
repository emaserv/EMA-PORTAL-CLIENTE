import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import { Tooltip, TablePagination } from "@mui/material"; // 👈 Agregar TablePagination
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
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
import { useAuth } from "layouts/auth/AuthContext";
import html2canvas from "html2canvas";
import ReactDOM from "react-dom/client";
import AcuseReciboConFirma from "./acuseConFirma.js";
import { API_BACK } from "../../../config.js";

dayjs.locale("ES");

// ─── Helpers ────────────────────────────────────────────────────────────────

const toDate = (dayjsObject) =>
  new Date(dayjsObject.year(), dayjsObject.month(), dayjsObject.date());

const parseDate = (dateString) => {
  const [day, month, year] = dateString.split("/");
  return new Date(year, month - 1, day);
};

const truncarTexto = (texto, limite) => {
  if (!texto || typeof texto !== "string") return "";
  return texto.length > limite ? texto.substring(0, limite) + "..." : texto;
};

const normalizarFecha2Digitos = (fecha) => {
  if (!fecha) return fecha;
  const partes = fecha.split("/");
  if (partes[2]?.length === 2) {
    return `${partes[0]}/${partes[1]}/${2000 + parseInt(partes[2])}`;
  }
  return fecha;
};

const descendingComparator = (a, b, orderBy) => {
  const valueA = isNaN(parseFloat(a[orderBy])) ? a[orderBy] : parseFloat(a[orderBy]);
  const valueB = isNaN(parseFloat(b[orderBy])) ? b[orderBy] : parseFloat(b[orderBy]);
  if (valueB < valueA) return -1;
  if (valueB > valueA) return 1;
  return 0;
};

const getComparator = (order, orderBy) =>
  order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);

// ─── Modal de carga ──────────────────────────────────────────────────────────

const MODAL_OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(3px)",
};

const MODAL_CARD_STYLE = {
  background: "#fff",
  borderRadius: "12px",
  padding: "36px 48px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  minWidth: "220px",
};

const SPINNER_STYLE = `
  @keyframes _acuse_spin {
    to { transform: rotate(360deg); }
  }
  ._acuse_spinner {
    width: 44px;
    height: 44px;
    border: 4px solid #e0e7ff;
    border-top-color: #2152ff;
    border-radius: 50%;
    animation: _acuse_spin 0.8s linear infinite;
  }
`;

function AcuseLoadingModal() {
  return (
    <>
      <style>{SPINNER_STYLE}</style>
      <div style={MODAL_OVERLAY_STYLE}>
        <div style={MODAL_CARD_STYLE}>
          <div className="_acuse_spinner" />
          <p
            style={{
              margin: 0,
              fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "#344767",
              letterSpacing: "0.01em",
            }}
          >
            Generando acuse...
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Sub-componentes estables ────────────────────────────────────────────────

const ICON_CELL_SX = { paddingTop: "2px", paddingBottom: "0px" };
const TEXT_CELL_SX = { fontSize: "0.875rem", paddingTop: "2px", paddingBottom: "2px" };

function IconLinkCell({ href, icon: Icon }) {
  const active = href && href !== "-";
  return (
    <TableCell sx={ICON_CELL_SX}>
      <a
        href={active ? href : "#"}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: "none",
          color: active ? "#4682B4" : "#D3D3D3",
          pointerEvents: active ? "auto" : "none",
          cursor: active ? "pointer" : "not-allowed",
        }}
      >
        <Icon fontSize="medium" />
      </a>
    </TableCell>
  );
}

IconLinkCell.propTypes = {
  href: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
};

function Completion({ value, color }) {
  return (
    <SoftBox display="flex" alignItems="center">
      <SoftTypography variant="caption" color="text" fontWeight="medium">
        {value}%&nbsp;
      </SoftTypography>
      <SoftBox width="8rem">
        <SoftProgress value={value} color={color} variant="gradient" label={false} />
      </SoftBox>
    </SoftBox>
  );
}

Completion.propTypes = {
  value: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

const HEAD_CELL_SX = {
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
};

function EnhancedTableHead({ order, orderBy, onRequestSort, headCells }) {
  const createSortHandler = (property) => (event) => onRequestSort(event, property);

  return (
    <TableHead style={{ height: "40px" }}>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={HEAD_CELL_SX}
            onClick={createSortHandler(headCell.id)}
          >
            <Tooltip title={headCell.labelComplete || "Sin información"}>
              <span>{headCell.label}</span>
            </Tooltip>
            {orderBy === headCell.id &&
              (order === "asc" ? (
                <HiChevronUp style={{ marginLeft: "5px", strokeWidth: "2" }} />
              ) : (
                <HiChevronDown style={{ marginLeft: "5px", strokeWidth: "2" }} />
              ))}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  headCells: PropTypes.array.isRequired,
};

// ─── Función de generación del acuse ────────────────────────────────────────

async function abrirAcuseEnNuevaPestaniaConCanvas(itemOriginal, user, setLoading) {
  const { nroCliente, fechaEmision: rawFecha } = itemOriginal;
  const idGrupoCliente = user?.idGrupoCliente;

  if (!nroCliente) {
    alert("No se puede generar el acuse: falta número de cliente");
    return;
  }

  const fechaEmision = normalizarFecha2Digitos(rawFecha);
  setLoading(true);

  try {
    const response = await fetch(
      `${API_BACK}/api/acuses/getAcuses?nroCliente=${nroCliente}&idGrupoCliente=${idGrupoCliente}`
    );
    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

    const result = await response.json();
    const acusesData = result.acusesData || result;

    let acuseData = Array.isArray(acusesData)
      ? acusesData.find((a) => a.fechaEmision === fechaEmision)
      : null;

    if (!acuseData && fechaEmision) {
      const fechaDM = fechaEmision.split("/").slice(0, 2).join("/");
      acuseData = acusesData.find(
        (a) => a.fechaEmision.split("/").slice(0, 2).join("/") === fechaDM
      );
    }

    if (!acuseData) {
      alert(`No se encontraron datos de acuse para la fecha ${fechaEmision}`);
      return;
    }

    const item = {
      nroCliente:    acuseData.nroCliente    || "-",
      nombreCliente: acuseData.nombreCliente || "-",
      medidor:       acuseData.medidor       || "-",
      direccion:     acuseData.direccion     || "-",
      entreCalle:    acuseData.entreCalle    || "",
      codigoPostal:  acuseData.codigoPostal  || "-",
      importe:       acuseData.importe       || "0",
      comprobante:   acuseData.comprobante   || "-",
      tipoEntrega:   acuseData.tipoEntrega   || "",
      referencia1:   acuseData.referencia1   || "",
      referencia2:   acuseData.referencia2   || "",
      referencia3:   acuseData.referencia3   || "",
      geo:           acuseData.geo           || null,
      foto:          acuseData.foto          || null,
      firma:         acuseData.firma         || null,
      codigoBarras:  acuseData.codigoBarras  || "000000",
      distribuidor:  acuseData.distribuidor  || "",
      dni:           acuseData.dni           || "",
      aclaracion:    acuseData.aclaracion    || "",
      vinculo:       acuseData.vinculo       || "",
      descripcion:   acuseData.descripcion   || "",
      fechaEmision:  acuseData.fechaEmision  || "-",
      vencimiento:   acuseData.vencimiento   || "-",
      fecha:         acuseData.fecha         || "-",
      hora:          acuseData.hora          || "-",
      segundaVisita: acuseData.segundaVisita || {},
    };

    const contenedor = document.createElement("div");
    Object.assign(contenedor.style, {
      position: "fixed",
      top: "-9999px",
      left: "0",
      width: "1000px",
      zIndex: "-1",
      backgroundColor: "#fff",
    });
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
            setLoading(false);
            return;
          }

          try {
            const canvas = await html2canvas(refElement, {
              useCORS: true,
              backgroundColor: "#fff",
              scrollY: 0,
              scale: 1.2,
            });

            canvas.toBlob((blob) => {
              if (!blob) {
                console.error("No se pudo generar el blob");
                setLoading(false);
                return;
              }

              const urlDescarga = URL.createObjectURL(blob);
              const reader = new FileReader();

              reader.onloadend = () => {
                const dataUrl = reader.result;
                setLoading(false);

                const nuevaVentana = window.open();
                if (nuevaVentana) {
                  nuevaVentana.document.write(`
                    <html><head><title>Acuse de Recibo</title><meta charset="UTF-8">
                    <style>
                      body{margin:0;font-family:Arial,sans-serif;display:flex;flex-direction:column;align-items:center;background:#f0f2f5;padding:20px}
                      .btn{margin:20px auto;padding:12px 24px;background:linear-gradient(135deg,#2152ff,#21d4fd);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .3s ease}
                      .btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(33,82,255,.3)}
                      img{max-width:100%;height:auto;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15)}
                      @media print{.btn{display:none}body{background:#fff;padding:0}}
                    </style></head>
                    <body>
                      <a href="${urlDescarga}" download="acuse_${item.codigoBarras}.jpg" class="btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.34v4h4.66v-4h3.34L12 2z"/></svg>
                        Descargar JPG
                      </a>
                      <div style="display:flex;justify-content:center;width:100%;max-width:1000px">
                        <img src="${dataUrl}" alt="Acuse de Recibo"/>
                      </div>
                    </body></html>
                  `);
                  nuevaVentana.document.close();
                } else {
                  alert("Por favor, permita ventanas emergentes para esta página");
                }
              };

              reader.onerror = (e) => {
                console.error("Error leyendo el blob:", e);
                setLoading(false);
              };

              reader.readAsDataURL(blob);
            }, "image/jpeg", 0.8);

          } catch (error) {
            console.error("Error al generar canvas:", error);
            alert("Error al generar el acuse. Verifique la consola para más detalles.");
            setLoading(false);
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
    setLoading(false);
  }
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function CalleAlturaTable({ data, columns }) {
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("cantidadDePiezas");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [loadingAcuse, setLoadingAcuse] = React.useState(false);

  const { user } = useAuth();
  const idGrupo = user?.idGrupoCliente;

  // ── Cabeceras dinámicas según grupo ─────────────────────────────────────
  const headCells = React.useMemo(() => [
    { id: "fechaEmision",    label: "F. Emision",    labelComplete: "Fecha de Emision" },
    ...(idGrupo !== 6 ? [{ id: "fechaVencimiento", label: "F. Vencimiento", labelComplete: "Fecha de Vencimiento" }] : []),
    { id: "nroCliente",     label: "Nro. Cliente",  labelComplete: "Numero de Cliente" },
    { id: "titular",        label: "Titular",        labelComplete: "Titular" },
    { id: "direccion",      label: "Direccion",      labelComplete: "Direccion" },
    { id: "localidad",      label: "Localidad",      labelComplete: "Localidad" },
    { id: "fecha",          label: "F. Dist.",       labelComplete: "Fecha de Distribucion" },
    { id: "hora",           label: "Hora",           labelComplete: "Hora" },
    { id: "importe",        label: "Importe",        labelComplete: "Importe" },
    ...(idGrupo === 6 ? [{ id: "comprobante", label: "Comprobante", labelComplete: "Comprobante" }] : []),
    { id: "estadoPieza",    label: "Est E.",         labelComplete: "Estado EMA" },
    { id: "obsVisita",      label: "Obs. Visita",    labelComplete: "Observacion de Visita" },
    { id: "geoVisita",      label: "V.",             labelComplete: "Geoposicion de Visita" },
    { id: "foto",           label: "Foto",           labelComplete: "Foto" },
    { id: "firma",          label: "Firma",          labelComplete: "Firma" },
    ...(idGrupo !== 6 ? [{ id: "imagenAD", label: "Im. AD", labelComplete: "Imagen Aviso Deuda" }] : []),
    ...(idGrupo === 4  ? [{ id: "acuse",   label: "ACUSE",  labelComplete: "Acuse" }] : []),
  ], [idGrupo]);

  // ── Handlers memoizados ──────────────────────────────────────────────────
  const handleRequestSort = React.useCallback((_, property) => {
    setOrder((prev) => (orderBy === property && prev === "asc" ? "desc" : "asc"));
    setOrderBy(property);
  }, [orderBy]);

  const handleChangePage = React.useCallback((_, newPage) => setPage(newPage), []);

  const handleChangeRowsPerPage = React.useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleAcuse = React.useCallback(
    (row) => abrirAcuseEnNuevaPestaniaConCanvas(row, user, setLoadingAcuse),
    [user]
  );

  // ── Filas visibles ───────────────────────────────────────────────────────
  const visibleRows = React.useMemo(
    () => {
      let rows = [...data].sort(getComparator(order, orderBy));
      
      // Solo filtrar BM si NO es grupo 6
      if (idGrupo !== 6) {
        rows = rows.filter((row) => row.estadoPieza !== "BM");
      }
      
      return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    },
    [data, order, orderBy, page, rowsPerPage, idGrupo]
  );

  const emptyRows = Math.max(0, (1 + page) * rowsPerPage - data.length);

  // ── Renderizado de celda por columna ─────────────────────────────────────
  const renderCell = React.useCallback(
    (row, column, index) => {
      const key = `${row.id}-${column}-${index}`;

      switch (column) {
        case "geoVisita":
          return (
            <TableCell key={key} sx={{ ...ICON_CELL_SX, paddingLeft: "0" }}>
              <a
                href={row.geoVisita || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: row.geoVisita ? "#4682B4" : "#D3D3D3" }}
              >
                <MapIcon fontSize="medium" />
              </a>
            </TableCell>
          );

        case "foto":
          return <IconLinkCell key={key} href={row.foto} icon={PhotoIcon} />;

        case "firma":
          return (
            <IconLinkCell key={key} href={row.firma !== "-" ? row.firma : null} icon={Edit} />
          );

        case "imagenAD":
        case "acuseDeDeuda":
          return (
            <IconLinkCell
              key={key}
              href={row.acuseDeDeuda !== "-" ? row.acuseDeDeuda : null}
              icon={ArticleIcon}
            />
          );

        case "acuse":
          return (
            <TableCell key={`${row.id}-acuse`} sx={ICON_CELL_SX}>
              <button
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => handleAcuse(row)}
              >
                <ArticleIcon sx={{ color: "#4682B4" }} fontSize="medium" />
              </button>
            </TableCell>
          );

        case "porcentaje":
          return (
            <TableCell key={key} align="left" sx={TEXT_CELL_SX}>
              <Completion value={row[column]} color="info" />
            </TableCell>
          );

        default:
          return (
            <TableCell key={key} align="left" sx={TEXT_CELL_SX}>
              <MobileFriendlyTooltip title={row[column] ? String(row[column]) : "Sin información"}>
                <span>{truncarTexto(String(row[column] || ""), 12)}</span>
              </MobileFriendlyTooltip>
            </TableCell>
          );
      }
    },
    [handleAcuse]
  );

  return (
    <Box sx={{ width: "100%" }}>
      {/* Modal de carga del acuse */}
      {loadingAcuse && <AcuseLoadingModal />}

      <Paper sx={{ width: "100%", mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              headCells={headCells}
            />
            <TableBody>
              {visibleRows.map((row, index) => (
                <TableRow key={`${row.id}-${index}`} hover tabIndex={-1}>
                  {headCells.map((hc) => renderCell(row, hc.id, index))}
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 2 * emptyRows }}>
                  <TableCell colSpan={headCells.length} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100, { value: -1, label: 'Todos' }]}
          component="div"
          count={idGrupo === 6 ? data.length : data.filter(row => row.estadoPieza !== "BM").length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
    </Box>
  );
}

CalleAlturaTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
};