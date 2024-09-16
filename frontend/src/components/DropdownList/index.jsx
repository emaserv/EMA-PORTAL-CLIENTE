import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import PropTypes from "prop-types";
import Popper from '@mui/material/Popper';
import './styles.css';

export default function DropdownList({ width, list, placeholder, campoAMostrar, campoID, inputRef, defaultValue, isDisabled, ...field }) {
  
  const handleOnChange = (event, newValue) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    const selectedID = newValue ? newValue[campoID] : null;
    field.onChange(selectedID);
  };

  const stackRef = React.useRef(null);
  const [popperWidth, setPopperWidth] = React.useState(null);

  

  return (
    <Stack 
      ref={stackRef} 
      sx={{ 
        width: width, 
        position: 'relative', 
        pointerEvents: isDisabled ? 'none' : 'auto' 
      }}
    >
      <Autocomplete
        options={list}
        getOptionLabel={(option) => option[campoAMostrar]}        
        defaultValue={list.find(item => item.id === defaultValue)}
        onChange={handleOnChange}
        onBlur={field.onBlur}
        value={field.value}
        renderInput={(params) => (
          <TextField
            {...params}
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
                width: width,
              },
            }}
            inputRef={inputRef}
            onChange={handleOnChange}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} style={{ fontSize: '0.875rem', fontWeight: '400' }}>
            {option[campoAMostrar]}
          </li>
        )}
        PopperComponent={(props) => (
          <Popper {...props} style={{ width: width, zIndex: 9999, position: 'relative'}}>
            {props.children}
          </Popper>
        )}
      />
    </Stack>
  );
}

DropdownList.propTypes = {
  width: PropTypes.string,
  list: PropTypes.array.isRequired,
  placeholder: PropTypes.string.isRequired,
  campoAMostrar: PropTypes.string.isRequired,
  campoID: PropTypes.string,
  defaultValue: PropTypes.number,
  children: PropTypes.object,
  inputRef: PropTypes.func,
  isDisabled: PropTypes.bool,
}; 

DropdownList.defaultProps = {
  isDisabled: false,
};
