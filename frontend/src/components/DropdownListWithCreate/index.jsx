import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import PropTypes from 'prop-types';
import Popper from '@mui/material/Popper';

const DropdownListWithCreate = ({ width, list, placeholder, campoAMostrar, campoID, value, onChange, ...field }) => {
  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    onChange({ [campoID]: null, [campoAMostrar]: inputValue });
  };

  const handleOnChange = (event, newValue) => {
    let selectedValue;
    if (newValue && typeof newValue === 'object') {
      selectedValue = { [campoID]: newValue[campoID], [campoAMostrar]: newValue[campoAMostrar] };
    } else if (typeof newValue === 'string') {
      selectedValue = { [campoID]: null, [campoAMostrar]: newValue };
    } else {
      selectedValue = null;
    }
    onChange(selectedValue);
  };

  const stackRef = React.useRef(null);
  const [popperWidth, setPopperWidth] = React.useState(null);

  React.useEffect(() => {
    if (stackRef.current) {
      setPopperWidth(stackRef.current.offsetWidth);
    }
  }, []);

  return (
    <Stack ref={stackRef} sx={{ width: { width } }}>
      <Autocomplete
        freeSolo
        options={list}
        getOptionLabel={(option) => option[campoAMostrar] || value} // Provide a default value
        onChange={handleOnChange}
        onBlur={field.onBlur}
        value={value}
        renderInput={(params) => (
          <TextField
            {...params}
            value={value}
            placeholder={placeholder}
            sx={{
              '& div': {
                fontSize: '0.875rem',
                fontWeight: '400',
                borderRadius: '8px',
                margin: '0',
              },
              'input': {
                padding: '0 !important',
              },
            }}
            onChange={handleInputChange}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} style={{ fontSize: '0.875rem', fontWeight: '400' }}>
            {option[campoAMostrar]}
          </li>
        )}
        PopperComponent={(props) => (
          <Popper {...props} style={{ width: popperWidth, zIndex: 9999 }}>
            {props.children}
          </Popper>
        )}
      />
    </Stack>
  );
};

DropdownListWithCreate.propTypes = {
  width: PropTypes.string,
  list: PropTypes.array.isRequired,
  placeholder: PropTypes.string.isRequired,
  campoAMostrar: PropTypes.string.isRequired,
  campoID: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node,

};

export default DropdownListWithCreate;
