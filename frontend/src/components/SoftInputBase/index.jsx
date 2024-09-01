import * as React from 'react';
import InputBase from '@mui/material/InputBase';
import PropTypes from 'prop-types';
import inputBase from "assets/theme/components/form/inputBase";

const SoftInputBase = (props) => {
    return (
        <InputBase
            {...props}
            {...props.field}
            onChange={(e) => {props.field.onChange(e.target.value)}}
            onBlur={props.field.onBlur}
            value={props.field.value}
            sx={inputBase.styleOverrides.root}
            inputProps={{ sx: inputBase.styleOverrides.input }}
        />
    );
};

export default SoftInputBase;

SoftInputBase.propTypes = {
    field: PropTypes.shape({
      onChange: PropTypes.func,
      onBlur: PropTypes.func,
      value: PropTypes.string,
      name: PropTypes.string,
    }),
  };