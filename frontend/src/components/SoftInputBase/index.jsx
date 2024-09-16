import * as React from 'react';
import InputBase from '@mui/material/InputBase';
import PropTypes from 'prop-types';
import inputBase from "assets/theme/components/form/inputBase";
import { styled } from '@mui/material/styles';

// Estilo para InputBase con borde rojo condicional
const StyledInputBase = styled(InputBase)(({ theme, error }) => ({
  ...inputBase.styleOverrides.root,
  borderColor: error ? 'red' : 'inherit',
  borderWidth: error ? '1px' : '0',
  borderStyle: error ? 'solid' : 'none',
  // Agrega otros estilos si es necesario
}));

const SoftInputBase = ({ field, error, ...props }) => {
  return (
    <StyledInputBase
      {...props}
      {...field}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      value={field.value}
      error={error}  // Pasa el error como prop
      sx={inputBase.styleOverrides.root}
      inputProps={{ sx: inputBase.styleOverrides.input }}
    />
  );
};

SoftInputBase.propTypes = {
  field: PropTypes.shape({
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    value: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  error: PropTypes.bool,  // Nueva prop para el estado de error
};

SoftInputBase.defaultProps = {
  error: false,  // Valor por defecto para error
};

export default SoftInputBase;
