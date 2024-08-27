import { createTheme, ThemeProvider } from '@mui/material/styles';
import * as React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

dayjs.locale('es');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('America/Argentina/Buenos_Aires');

const theme = createTheme({
  components: {
    MuiClockNumber: {
      styleOverrides: {
        root: {
          color: '#000', // Color de los números del reloj
          '&.Mui-selected': {
            backgroundColor: '#1976d2', // Color de fondo del número seleccionado
            color: '#fff', // Color de texto del número seleccionado
          },
        },
      },
    },
    MuiPickersClockPointer: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2', // Color de la aguja del reloj
        },
        thumb: {
          backgroundColor: '#1976d2', // Color del círculo en el centro de la aguja
          borderColor: '#1976d2', // Borde del círculo en el centro
        },
      },
    },
  },
});

export default function TimePickerValue({ field, defaultValue, disabled }) {
  const [selectedTime, setSelectedTime] = useState(
    defaultValue ? dayjs.tz(defaultValue, 'HH:mm', 'America/Argentina/Buenos_Aires') : dayjs().tz('America/Argentina/Buenos_Aires').startOf('minute')
  );

  useEffect(() => {
    if (defaultValue) {
      setSelectedTime(dayjs.tz(defaultValue, 'HH:mm', 'America/Argentina/Buenos_Aires'));
    }
  }, [defaultValue]);

  const handleTimeChange = (time) => {
    setSelectedTime(time);
    const horaEmisionValue = time ? time.$d : null;
    field.onChange(horaEmisionValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} locale={'es'}>
        <Box sx={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <DemoContainer components={['TimePicker', 'TimePicker']}>
            <TimePicker
              value={selectedTime}
              onChange={handleTimeChange}
              format="HH:mm"
              disabled={disabled}
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

TimePickerValue.propTypes = {
  field: PropTypes.object.isRequired,
  defaultValue: PropTypes.string,
  disabled: PropTypes.bool, // Añadido para la nueva propiedad
};

TimePickerValue.defaultProps = {
  disabled: false, // Valor predeterminado de la nueva propiedad
};