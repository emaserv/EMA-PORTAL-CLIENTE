import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import PropTypes from "prop-types";
import Popper from '@mui/material/Popper';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import './styles.css';

const iconoSinMarcar = <CheckBoxOutlineBlankIcon fontSize="small" />;
const iconoMarcado = <CheckBoxIcon fontSize="small" />;

export default function DropdownList({ width, list, placeholder, campoAMostrar, campoID, inputRef, defaultValue, isDisabled, multiple, ...field }) {

  const handleOnChange = (event, newValue) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    if (multiple) {
      const selectedIDs = (newValue || []).map((item) => item[campoID]);
      field.onChange(selectedIDs);
      return;
    }
    const selectedID = newValue ? newValue[campoID] : null;
    field.onChange(selectedID);
  };

  const stackRef = React.useRef(null);

  const multipleValue = Array.isArray(field.value)
    ? field.value.map((id) => list.find((item) => item[campoID] === id)).filter(Boolean)
    : [];

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
        multiple={multiple}
        disableCloseOnSelect={multiple}
        options={list}
        getOptionLabel={(option) => option[campoAMostrar]}
        isOptionEqualToValue={(option, value) => option[campoID] === value?.[campoID]}
        defaultValue={list.find(item => item.id === defaultValue)}
        onChange={handleOnChange}
        onBlur={field.onBlur}
        value={multiple ? multipleValue : field.value}
        renderTags={(selected) => (
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selected.length
              ? `${selected.length} seleccionado${selected.length > 1 ? 's' : ''}`
              : ''}
          </span>
        )}
        sx={{
          '& .MuiAutocomplete-inputRoot': {
            flexWrap: 'nowrap',
            overflow: 'hidden',
          },
          '& .MuiAutocomplete-input': {
            minWidth: '0 !important',
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            sx={{
              margin: 0,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                padding: '0.5rem 0.75rem !important',
              },
              '& .MuiOutlinedInput-input': {
                fontSize: '0.875rem',
                fontWeight: '400',
                padding: '0 !important',
                height: '1.375rem',
                width: width,
              },
            }}
            inputRef={inputRef}
            onChange={handleOnChange}
          />
        )}
        renderOption={(props, option, { selected }) => (
          <li {...props} style={{ fontSize: '0.875rem', fontWeight: '400' }}>
            {multiple && (
              <Checkbox
                icon={iconoSinMarcar}
                checkedIcon={iconoMarcado}
                checked={selected}
                style={{ marginRight: 8, padding: 0 }}
              />
            )}
            {option[campoAMostrar]}
          </li>
        )}
        PopperComponent={(props) => (
          <Popper {...props} style={{ ...props.style, zIndex: 9999 }}>
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
  multiple: PropTypes.bool,
};

DropdownList.defaultProps = {
  isDisabled: false,
  multiple: false,
};
