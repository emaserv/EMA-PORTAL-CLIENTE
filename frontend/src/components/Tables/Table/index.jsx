/**
=========================================================
* Soft UI Dashboard React - v4.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useMemo } from "react";

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// uuid is a library for generating unique id
import { v4 as uuidv4 } from "uuid";

// @mui material components
import { Table as MuiTable } from "@mui/material";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftAvatar from "components/SoftAvatar";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React base styles
import colors from "./base/colors";
import typography from "./base/typography";
import borders from "./base/borders";
import { HiChevronUp, HiChevronDown } from 'react-icons/hi';

function Table({ columns, rows, handleSort, formatear=true, sort, sorttpo }) {
  const { light } = colors;
  const { size, fontWeightBold } = typography;
  const { borderWidth } = borders;
  
  const ascendingIcon = <HiChevronUp style={{float:'right', strokeWidth:"2",marginTop:"5px"}}/>;
  const descendingIcon = <HiChevronDown style={{float:"right", strokeWidth:"2", marginTop:"5px"}}/>;

  const renderColumns = columns.map(({ name, align, width, hint }, key) => {
    

    return (
      <>
      <SoftBox
        key={name}
        component="th"
        title={hint}
        width={width || "auto"}
        textAlign={align}
        fontSize={size.xxs}
        fontWeight={fontWeightBold}
        color="secondary"
        opacity={0.7}
        style={{cursor: 'pointer'}}
        borderBottom={`${borderWidth[1]} solid ${light.main}`}
        onClick={()=>{handleSort(name)}}
      >
        {name.toUpperCase()}
        {sort == name && (
        sorttpo == 'asc' 
        ? ascendingIcon : 
        descendingIcon
      )}
      </SoftBox>
   
      </>
    );
  });

  
  function formatearFecha(fecha) {
    if(!fecha.props)
      return null
    if(!fecha.props.children)
      return null
    if(fecha.props.children.length < 8)
       return null
    fecha = new Date(fecha.props.children)
    // Obtenemos los componentes de la fecha
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1; // Los meses van de 0 a 11, por lo que sumamos 1
    const año = fecha.getFullYear();
  
    // Formateamos los componentes como cadena y agregamos un cero adelante si es necesario
    const diaFormateado = dia < 10 ? '0' + dia : dia;
    const mesFormateado = mes < 10 ? '0' + mes : mes;
  
    if(diaFormateado)
      return `${diaFormateado}/${mesFormateado}/${año}`;
    else 
      return  null
  }


  const renderRows = rows.map((row, key) => {
    const rowKey = `row-${key}`;

    const tableRow = columns.map(({ name, align }) => {
      let template;

      if (Array.isArray(row[name])) {
        let date = formatearFecha(row[name][1])
        let render = row[name][1]
        if (date != null){
          render = date
        }
        
        template = (
          <SoftBox
            key={uuidv4()}
            component="td"
            p={1}
            borderBottom={row.hasBorder ? `${borderWidth[1]} solid ${light.main}` : null}
          >
            <SoftBox display="flex" alignItems="center">
              <SoftBox>
                <SoftAvatar src={row[name][0]} name={row[name][1]} variant="rounded" size="sm" />
              </SoftBox>
              <SoftTypography variant="button" fontWeight="medium" sx={{ width: "max-content" }}>
                {formatear? render : row[name][i]}
              </SoftTypography>
            </SoftBox>
          </SoftBox>
        );
      } else {
        let date = formatearFecha(row[name])
        let render = row[name]
        if(date != null){
          render = date
        }
        template = (
          <SoftBox
            key={uuidv4()}
            component="td"
            p={1}
            textAlign={align}
            borderBottom={row.hasBorder ? `${borderWidth[1]} solid ${light.main}` : null}
          >
            <SoftTypography
              variant="button"
              fontWeight="regular"
              color="secondary"
              sx={{ display: "inline-block", width: "max-content" }}
            >
              {formatear ? render : row[name]}
            </SoftTypography>
          </SoftBox>
        );
      }

      return template;
    });

    return <TableRow key={rowKey}>{tableRow}</TableRow>;
  });

  return useMemo(
    () => (
      <TableContainer>
        <MuiTable>
          <SoftBox component="thead">
            <TableRow>{renderColumns}</TableRow>
          </SoftBox>
          <TableBody>{renderRows}</TableBody>
        </MuiTable>
      </TableContainer>
    ),
    [columns, rows]
  );
}

// Setting default values for the props of Table
Table.defaultProps = {
  columns: [],
  rows: [{}],
};

// Typechecking props for the Table
Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object),
  rows: PropTypes.arrayOf(PropTypes.object),
  formatearFecha: PropTypes.bool,
  handleSort: PropTypes.func,
  sort: PropTypes.string,
  sorttpo: PropTypes.string
};

export default Table;
