import * as React from 'react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { visuallyHidden } from '@mui/utils';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftProgress from 'components/SoftProgress';
import { Icon } from '@mui/material';
import { Link } from "react-router-dom";
import InputBase from '@mui/material/InputBase';
import { maxHeight, maxWidth } from '@mui/system';
import { HiChevronUp, HiChevronDown } from 'react-icons/hi';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField'; 
import { format } from 'date-fns'; 
import dayjs from 'dayjs';
import 'dayjs/locale/es';




dayjs.locale('ES');

const toDate = (dayjsObject) => new Date(dayjsObject.year(), dayjsObject.month(), dayjsObject.date());
const todayGMT3 = dayjs().subtract(3, 'hour');


export default function EnhancedTable({ data, columns }) {
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('cantidadDePiezas');
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
    const [day, month, year] = dateString.split('/');
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
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  const descendingComparator = (a, b, orderBy) => {
    const valueA = isNaN(parseFloat(a[orderBy])) ? a[orderBy] : parseFloat(a[orderBy]);
    const valueB = isNaN(parseFloat(b[orderBy])) ? b[orderBy] : parseFloat(b[orderBy]);

    if (valueB < valueA) return -1;
    if (valueB > valueA) return 1;
    return 0;
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
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
    id: 'grupoCliente',
    numeric: false,
    disablePadding: false,
    label: 'Cliente',
  },
  {
    id: 'nroCliente',
    numeric: false,
    disablePadding: false,
    label: 'Nro. Cliente',
  },
  {
    id: 'titular',
    numeric: false,
    disablePadding: false,
    label: 'Titular',
  },
  {
    id: 'sucursal',
    numeric: false,
    disablePadding: false,
    label: 'Sucursal',
  },
  {
    id: 'plan',
    numeric: false,
    disablePadding: false,
    label: 'Plan',
  },
  {
    id: 'radio',
    numeric: false,
    disablePadding: false,
    label: 'Radio',
  },
  {
    id: 'estadoPieza',
    numeric: false,
    disablePadding: false,
    label: 'Estado',
  },
  {
    id: 'geoVisita',
    numeric: false,
    disablePadding: false,
    label: 'Geo. Visita',
  },
  {
    id: 'foto',
    numeric: false,
    disablePadding: false,
    label: 'Foto',
  },
];

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

function EnhancedTableHead(props) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };
  const ascendingIcon = <HiChevronUp style={{ marginLeft: "5px", strokeWidth:"2"}}/>;
  const descendingIcon = <HiChevronDown style={{marginLeft: "5px", strokeWidth:"2"}}/>;


  return (
    <TableHead style={{height: '40px'}}>
      <TableRow style={{
           background: 'linear-gradient(to top, #2152ff, #21d4fd)', 
           borderRadius: '1px', // Bordes redondeados
           minWidth:'auto',
           fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
           fontSize: '0.85rem',
           opacity:1,
           cursor:'pointer',
           fontWeight: '700',
           color: '#ffffff', // Texto en blanco para mayor contraste
           textTransform: 'uppercase',
           padding:'0px',
           paddingLeft:'16px'
            //boxShadow: '0rem 0.25rem 0.4375rem -0.0625rem rgba(0, 0, 0, 0.11), 0rem 0.125rem 0.25rem -0.0625rem rgba(0, 0, 0, 0.07)'
            }}>
        
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{
              background: 'linear-gradient(to top, #2152ff, #21d4fd)', 
              borderRadius: '1px', // Bordes redondeados
              minWidth:'auto',
              fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
              fontSize: '0.85rem',
              opacity:1,
              cursor:'pointer',
              fontWeight: '700',
              color: '#ffffff', // Texto en blanco para mayor contraste
              textTransform: 'uppercase',
              padding:'0px',
              paddingLeft:'10px'
            //boxShadow: '0rem 0.25rem 0.4375rem -0.0625rem rgba(0, 0, 0, 0.11), 0rem 0.125rem 0.25rem -0.0625rem rgba(0, 0, 0, 0.07)'
            }}
            selected={numSelected > 0 && orderBy === headCell.id}
            onClick={createSortHandler(headCell.id)}
          >
         
              {headCell.label}
              {orderBy === headCell.id && (
               order == 'asc' 
                ? ascendingIcon : 
                descendingIcon
              )}
             
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
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
  control: PropTypes.object.isRequired,
};

function EnhancedTableToolbar({numSelected,startDate, endDate, setEndDate, setStartDate}) {

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };


  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}
    >
      
    </Toolbar>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
  setEndDate: PropTypes.func.isRequired,
  setStartDate: PropTypes.func.isRequired,
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
};


const visibleRows = React.useMemo(
  () =>
    data
      .filter(item => filterByDateRange(item, startDate, endDate))
      .sort((a, b) => (order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy]))
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
  [data, order, orderBy, page, rowsPerPage, startDate, endDate]
);
  

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
      <EnhancedTableToolbar numSelected={selected.length}  setStartDate={handleStartDateChange} setEndDate={handleEndDateChange} startDate={startDate} endDate={endDate}/>
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size={dense ? 'small' : 'medium'}
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
                  <TableRow
                    key={rowKey}  // Proporcionar una clave única
                    hover
                    onClick={(event) => handleClick(event, row.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >

                    {columns.map(column => (
                      //Con esto oculto la columna que tiene el id
                      //NO BORRAR LA COLUMNA ID PORQUE SI NO SE ROMPE LA TABLA
                      column != 'id' && (
                        <TableCell key={`${row.id}-${column}`} align="left" sx={{ fontSize: '0.875rem',  paddingTop: '2px', paddingBottom: '2px'}}>
                          {column != "porcentaje" ? row[column]: 
                           
                            <Completion value={row[column]} color="info" />
                           }
                        </TableCell>
                      )
                    ))}
                   
                  </TableRow>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight:'10vh' }}>
        <TablePagination
          rowsPerPageOptions={[5, 15, 25, 50, 75, 100]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
        </div>
      </Paper>
    </Box>
  );
}


EnhancedTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  control: PropTypes.object.isRequired,
};