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
import { TABLE_HEADER_CELL_SX, COLOR_ICON_ACTIVE, COLOR_ICON_DISABLED } from "assets/uiConstants";

dayjs.locale("ES");

const toDate = (dayjsObject) =>
  new Date(dayjsObject.year(), dayjsObject.month(), dayjsObject.date());
const todayGMT3 = dayjs().subtract(3, "hour");

export default function NaturgyTable({ data, columns }) {
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("cantidadDePiezas");
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);

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

  const headCells = [
    {
      id: "fechaEmision",
      numeric: false,
      disablePadding: false,
      label: "F. Emision",
      labelComplete: "Fecha de Emision",
    },
    {
      id: "fechaVencimiento",
      numeric: false,
      disablePadding: false,
      label: "F. Vencimiento",
      labelComplete: "Fecha de Vencimiento",
    },
    {
      id: "nroCliente",
      numeric: false,
      disablePadding: false,
      label: "Nro. Cliente",
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
      label: "F. Dist.",
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
    {
      id: "estadoPieza",
      numeric: false,
      disablePadding: false,
      label: "Est E.",
      labelComplete: "Estado EMA",
    },

    {
      id: "obsVisita",
      numeric: false,
      disablePadding: false,
      label: "Obs. Visita",
      labelComplete: "Observacion de Visita",
    },
    {
      id: "medidor",
      numeric: false,
      disablePadding: false,
      label: "Medidor",
      labelComplete: "Medidor",
    },
    {
      id: "entreCalles",
      numeric: false,
      disablePadding: false,
      label: "Entre Calles",
      labelComplete: "Entre Calles",
    },
    {
      id: "codigoPostal",
      numeric: false,
      disablePadding: false,
      label: "CP",
      labelComplete: "Código Postal",
    },
    {
      id: "fechaIngreso",
      numeric: false,
      disablePadding: false,
      label: "F. Ing",
      labelComplete: "Fecha de Ingreso",
    },
    //{
    //  id: "estadoMetro",
    //  numeric: false,
    //  disablePadding: false,
    // label: "Est M.",
    //  labelComplete: "Estado Metrogas",
    //},
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
    {
      id: "imagenAD",
      numeric: false,
      disablePadding: false,
      label: "Im. AD",
      labelComplete: "Imagen Aviso Deuda",
    },
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
        <TableRow style={{ height: "40px" }}>
          {headCells.map((headCell) => (
            <TableCell
              key={headCell.id}
              align={headCell.numeric ? "right" : "left"}
              padding={headCell.disablePadding ? "none" : "normal"}
              sortDirection={orderBy === headCell.id ? order : false}
              sx={{ ...TABLE_HEADER_CELL_SX, cursor: "pointer" }}
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
  }) {}

  EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    setEndDate: PropTypes.func.isRequired,
    setStartDate: PropTypes.func.isRequired,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
  };

  // Función para truncar texto
  const truncarTexto = (texto, limite) => {
    //console.log("WASAAAAAA", texto);
    if (!texto || typeof texto !== 'string') {
      return ''; // O devuelve otro valor predeterminado si lo prefieres
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
                    {/* Primera fila */}
                    {row.estadoPieza !== "BM" ? (
                      <TableRow
                        key={`${rowKey}`} // Proporcionar una clave única para la primera fila
                        hover
                        tabIndex={-1}
                      >
                        {columns.map(
                          (column) =>
                            // Con esto oculto la columna que tiene el id
                            // NO BORRAR LA COLUMNA ID PORQUE SI NO SE ROMPE LA TABLA
                            column !== "id" &&
                            column !== "geoVisita" &&
                            column !== "grupoCliente" &&
                            column !== "plan" &&
                            column !== "radio" &&
                            column !== "sucursal" &&
                            column !== "firma" &&
                            column !== "foto" &&
                            column !== "foto" &&
                            column !== "acuseDeDeuda" &&
                            column !== "estadoMetro" && (
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
                                  <MobileFriendlyTooltip title={row[column] ? row[column] : 'Sin información'}>
                                    <span>{truncarTexto(row[column], 12)}</span>
                                  </MobileFriendlyTooltip>
                                ) : (
                                  <Completion
                                    value={row[column]}
                                    color="info"
                                  />
                                )}
                              </TableCell>
                            )
                        )}

                        <TableCell
                          id={`${row.id}-geoVisita-1`}
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
                              color: row.geoVisita ? COLOR_ICON_ACTIVE : COLOR_ICON_DISABLED,
                            }}
                          >
                            <MapIcon fontSize="medium" />
                          </a>
                        </TableCell>

                          <TableCell
                            id={`${row.id}-foto-1`}
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
                                color: row.foto ? COLOR_ICON_ACTIVE : COLOR_ICON_DISABLED,
                              }}
                            >
                              <PhotoIcon fontSize="medium" />
                            </a>
                          </TableCell>

                          <TableCell
                            id={`${row.id}-firma-1`}
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
                                color: row.firma !== '-' ? COLOR_ICON_ACTIVE : COLOR_ICON_DISABLED,
                                pointerEvents: row.firma !== '-' ? "auto" : "none", // Deshabilita el click si es '-'
                                cursor: row.firma !== '-' ? "pointer" : "not-allowed",
                              }}
                            >
                              <Edit fontSize="medium" />
                            </a>
                          </TableCell>
                          

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
                  <TableCell colSpan={columns.length + 1} />
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
        >
          {/* 
          <TablePagination
            rowsPerPageOptions={[5, 15, 25, 50, 75, 100]}
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count}`
            }
          />
          */}
        </div>
      </Paper>
    </Box>
  );
}

NaturgyTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  control: PropTypes.object.isRequired,
};
