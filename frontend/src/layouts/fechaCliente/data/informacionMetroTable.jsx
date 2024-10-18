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

dayjs.locale("ES");

const toDate = (dayjsObject) =>
  new Date(dayjsObject.year(), dayjsObject.month(), dayjsObject.date());
const todayGMT3 = dayjs().subtract(3, "hour");

export default function InformacionMetroTable({ data, columns }) {
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
      id: "Empresa",
      numeric: false,
      disablePadding: false,
      label: "Referencias de Entrega",
      labelComplete: "Referencias de Entrega",
    },
    {
      id: "ZP",
      numeric: false,
      disablePadding: false,
      label: "1° BAJO PUERTA ZONA PELIGROSA",
      labelComplete: "1° BAJO PUERTA ZONA PELIGROSA",
    },
    {
      id: "BP_CR",
      numeric: false,
      disablePadding: false,
      label: "BAJO PUERTA",
      labelComplete: "BAJO PUERTA",
    },
    {
      id: "FAD",
      numeric: false,
      disablePadding: false,
      label: "FIRMADO (AD)",
      labelComplete: "FIRMADO (AD)",
    },
    {
      id: "NV",
      numeric: false,
      disablePadding: false,
      label: "NO VISITADO",
      labelComplete: "NO VISITADO",
    },
    {
      id: "UZP",
      numeric: false,
      disablePadding: false,
      label: "ULTIMA ZONA PELIGROSA",
      labelComplete: "ULTIMA ZONA PELIGROSA",
    },
    {
      id: "ZP_CR_2",
      numeric: false,
      disablePadding: false,
      label: "BAJO PUERTA  ZONA PELIGROSA",
      labelComplete: "BAJO PUERTA  ZONA PELIGROSA",
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
        <TableRow
          style={{
            background: "linear-gradient(to top, #2152ff, #21d4fd)",
            borderRadius: "10 px", // Bordes redondeados
            minWidth: "auto",
            fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
            fontSize: "0.3rem",
            opacity: 1,
            cursor: "pointer",
            fontWeight: "500",
            color: "#ffffff", // Texto en blanco para mayor contraste
            textTransform: "uppercase",
            padding: "0px",
            paddingLeft: "16px",
            //boxShadow: '0rem 0.25rem 0.4375rem -0.0625rem rgba(0, 0, 0, 0.11), 0rem 0.125rem 0.25rem -0.0625rem rgba(0, 0, 0, 0.07)'
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
                borderRadius: "1px", // Bordes redondeados
                minWidth: "auto",
                fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                fontSize: "0.85rem",
                opacity: 1,
                cursor: "pointer",
                fontWeight: "700",
                color: "#ffffff", // Texto en blanco para mayor contraste
                textTransform: "uppercase",
                padding: "0px",
                paddingLeft: "10px",
                //boxShadow: '0rem 0.25rem 0.4375rem -0.0625rem rgba(0, 0, 0, 0.11), 0rem 0.125rem 0.25rem -0.0625rem rgba(0, 0, 0, 0.07)'
              }}
              selected={numSelected > 0 && orderBy === headCell.id}
              onClick={createSortHandler(headCell.id)}
            >
              <Tooltip
                title={
                  headCell.labelComplete
                    ? headCell.labelComplete
                    : "Sin información"
                }
              >
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
    console.log("WASAAAAAA", texto);
    if (!texto || typeof texto !== "string") {
      return ""; // O devuelve otro valor predeterminado si lo prefieres
    }

    if (texto.length > limite) {
      return texto.substring(0, limite) + "...";
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
                            column !== "foto" && (
                              <TableCell
                                key={`${row.id}-${column}-${index}`}
                                align="center"
                                sx={{
                                  fontSize: "0.875rem",
                                  paddingTop: "2px",
                                  paddingBottom: "2px",
                                }}
                              >
                                {column !== "porcentaje" ? (
                                  <MobileFriendlyTooltip
                                    title={
                                      row[column]
                                        ? row[column]
                                        : "Sin información"
                                    }
                                  >
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

InformacionMetroTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  control: PropTypes.object.isRequired,
};
