import * as React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';
import PropTypes from 'prop-types';

dayjs.locale('es');

const theme = createTheme({
  components: {
    MuiCalendarPicker: {
      styleOverrides: {
        root: {
          '& .MuiDayPicker-day': {
            color: '#000',
            '&.Mui-selected': {
              backgroundColor: '#1976d2',
              color: '#fff',
            },
          },
        },
      },
    },
    MuiDayPickerHeader: {
      styleOverrides: {
        root: {
          color: '#000',
        },
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        day: {
          color: '#000',
          '&.Mui-selected': {
            backgroundColor: '#1976d2',
            color: '#fff',
          },
        },
      },
    },
  },
});

export default function DatePickerValue({ field, disabled }) {
  // Inicializa el estado con defaultValue o la fecha actual si no está definido
  const [selectedDate, setSelectedDate] = useState();

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const fechaEmisionValue = date ? date.$d : null; // $d es el campo dentro de date que tiene el string con la fecha
    field.onChange(fechaEmisionValue);
  };



  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          format="DD-MM-YYYY"
          readOnly={disabled}
          slotProps={{
            textField: { size: 'small' },
            openPickerButton: { size: 'small', sx: { padding: '2px' } },
            openPickerIcon: { fontSize: 'small' },
          }}
          sx={{
            width: '200px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              padding: '0.5rem 0.75rem !important',
            },
            '& .MuiOutlinedInput-input': {
              fontSize: '0.875rem',
              fontWeight: '400',
              padding: '0 !important',
              height: '1.375rem',
            },
            '& input::placeholder': {
              color: '#8392ab',
            },
            '@media (max-width:600px)': {
              '& .MuiOutlinedInput-input': {
                fontSize: '0.75rem',
              },
            },
          }}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

DatePickerValue.propTypes = {
  field: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};

DatePickerValue.defaultProps = {
  disabled: false,
};
