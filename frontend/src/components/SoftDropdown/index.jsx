import React from 'react';
import { FormControl, Select, MenuItem } from '@material-ui/core';
import PropTypes from 'prop-types';

const SoftDropdown = ({ value, onChange, options, placeholder }) => {

  SoftDropdown.propTypes = {
    value: PropTypes.any.isRequired,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.array.isRequired,
    placeholder: PropTypes.string.isRequired
  };
  return (
    <FormControl fullWidth>
      <Select
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '40px',
          border: '1px solid #ced4da',
          borderRadius: '8px',
          textAlign: 'left',
          fontSize: 'smaller'
        }}
      >
        {options.map(option => (
          <MenuItem key={option.id} value={option.id}>
            {option.nombre}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SoftDropdown;
