import * as React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

// Esto es para poner los meses en español
dayjs.locale('ES');

const theme = createTheme({
  components: {
    MuiCalendarPicker: {
      styleOverrides: {
        root: {
          // Customize the root of the calendar picker
          '& .MuiDayPicker-day': {
            color: '#000', // Color of the day numbers
            '&.Mui-selected': {
              backgroundColor: '#1976d2', // Background color of the selected day
              color: '#fff', // Text color of the selected day
            },
          },
        },
      },
    },
    MuiDayPickerHeader: {
      styleOverrides: {
        root: {
          // Customize the header of the day picker
          color: '#000', // Color of the header text (month and year)
        },
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        day: {
          // Customize the day cells
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

export default function DatePickerValue({ field, defaultValue, disabled }) {
  // Inicializa el estado con la fecha actual si no hay defaultValue
  const [selectedDate, setSelectedDate] = useState(defaultValue ? dayjs(defaultValue) : dayjs());

  useEffect(() => {
    // Actualiza el estado si cambia defaultValue
    if (defaultValue) {
      setSelectedDate(dayjs(defaultValue));
    }
  }, [defaultValue]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const fechaEmisionValue = date ? date.$d : null; // $d es el campo dentro de date que tiene el string con la fecha
    field.onChange(fechaEmisionValue);
  };

  return (
    <ThemeProvider theme={theme}>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'es'}>
      <Box sx={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        <DemoContainer components={['DatePicker', 'DatePicker']}>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format="DD-MM-YYYY"
            readOnly={disabled}
            sx={{
              width: '100%',
              '& div': {
                borderRadius: '8px',
              },
              '& input': {
                fontSize: '0.875rem',
                fontWeight: '400',
                padding: '0.75rem',
              },
              '& input::placeholder': {
                color: '#8392ab',
              },
              '@media (max-width:600px)': {
                '& input': {
                  fontSize: '0.75rem', // Reduce el tamaño del texto en pantallas pequeñas
                },
              },
            }}
          />
        </DemoContainer>
      </Box>
    </LocalizationProvider>
    </ThemeProvider>
  );
}

DatePickerValue.propTypes = {
  field: PropTypes.object.isRequired,
  defaultValue: PropTypes.string,
  disabled: PropTypes.bool, // Añadido para la nueva propiedad
};

DatePickerValue.defaultProps = {
  disabled: false, // Valor predeterminado de la nueva propiedad
};
