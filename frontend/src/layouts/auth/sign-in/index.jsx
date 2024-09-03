import React, { useState } from 'react';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import { API_BACK } from 'config';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import CoverLayout from 'layouts/auth/components/CoverLayout';
import logoEma from 'assets/images/Portal-Cliente-Images/Logo-ema.png';
import SoftInputBase from 'components/SoftInputBase';

const SignIn = ({ setToken }) => {
  const { handleSubmit, control, formState: { errors } } = useForm();
  const [loginError, setLoginError] = useState('');

  const onSubmit = async (data) => {
    if (!data.userName || !data.password) {
      setLoginError('Por favor, complete todos los campos.');
      return;
    }

    const formData = new FormData();
    formData.append('data', JSON.stringify(data));

    try {
      const response = await axios.post(`${API_BACK}/api/login`, formData);
      if (response.status === 200) {
        document.location = '/home';
      }
    } catch (error) {
      if (error.response) {
        // Manejo de errores basado en el código de estado HTTP
        if (error.response.status === 401) {
          setLoginError('Nombre de usuario o contraseña incorrectos.');
        } else if (error.response.status === 500) {
          setLoginError('Error del servidor. Por favor, intente de nuevo más tarde.');
        } else {
          setLoginError('Error desconocido. Por favor, intente de nuevo.');
        }
      } else {
        setLoginError('Error de red. Por favor, verifique su conexión.');
      }
    }
  };

  return (
    <CoverLayout
      title="Bienvenido a Portal Clientes!"
      description="Ingrese sus credenciales para iniciar sesión"
      image={logoEma}
    >
      <SoftBox>
        <form onSubmit={handleSubmit(onSubmit)}>
          <SoftBox mb={2}>
            <SoftBox mb={1} ml={0.5}>
              <SoftTypography
                component="label"
                variant="caption"
                fontWeight="bold"
              >
                Nombre de Usuario
              </SoftTypography>
            </SoftBox>
            <Controller
              name="userName"
              control={control}
              render={({ field }) => (
                <SoftInputBase
                  type="text"
                  placeholder="Usuario"
                  field={field}
                  sx={{
                    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                    letterSpacing: '0.00938em',
                    boxSizing: 'border-box',
                    position: 'relative',
                    cursor: 'text',
                    webkitBoxAlign: 'center',
                    padding: '0.5rem 0.75rem',
                    border: '0.0625rem solid rgb(210, 214, 218)',
                    borderRadius: '0.5rem',
                    pointerEvents: 'auto',
                    display: 'grid !important',
                    placeItems: 'center !important',
                    width: '100% !important',
                    height: 'auto !important',
                    fontSize: '0.875rem !important',
                    fontWeight: '400 !important',
                    lineHeight: '1.4 !important',
                    color: 'rgb(73, 80, 87) !important',
                    backgroundColor: 'rgb(255, 255, 255) !important',
                    backgroundClip: 'padding-box !important',
                    appearance: 'none !important',
                    transition: 'box-shadow 150ms ease 0s, border-color 150ms ease 0s, padding 150ms ease 0s !important',
                    '& input': {
                      paddingTop: '0px',
                      paddingBottom: '0px',
                    },
                  }}
                />
              )}
            />
            {errors.userName && <SoftTypography variant="caption" color="error">Campo requerido</SoftTypography>}
          </SoftBox>

          <SoftBox mb={2}>
            <SoftBox mb={1} ml={0.5}>
              <SoftTypography
                component="label"
                variant="caption"
                fontWeight="bold"
              >
                Contraseña
              </SoftTypography>
            </SoftBox>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <SoftInputBase
                  type="password"
                  placeholder="Contraseña"
                  field={field}
                  sx={{
                    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                    letterSpacing: '0.00938em',
                    boxSizing: 'border-box',
                    position: 'relative',
                    cursor: 'text',
                    webkitBoxAlign: 'center',
                    padding: '0.5rem 0.75rem',
                    border: '0.0625rem solid rgb(210, 214, 218)',
                    borderRadius: '0.5rem',
                    pointerEvents: 'auto',
                    display: 'grid !important',
                    placeItems: 'center !important',
                    width: '100% !important',
                    height: 'auto !important',
                    fontSize: '0.875rem !important',
                    fontWeight: '400 !important',
                    lineHeight: '1.4 !important',
                    color: 'rgb(73, 80, 87) !important',
                    backgroundColor: 'rgb(255, 255, 255) !important',
                    backgroundClip: 'padding-box !important',
                    appearance: 'none !important',
                    transition: 'box-shadow 150ms ease 0s, border-color 150ms ease 0s, padding 150ms ease 0s !important',
                    '& input': {
                      paddingTop: '0px',
                      paddingBottom: '0px',
                    },
                  }}
                />
              )}
            />
            {errors.password && <SoftTypography variant="caption" color="error">Campo requerido</SoftTypography>}
          </SoftBox>

          {loginError && (
            <SoftBox mb={2}>
              <SoftTypography variant="caption" color="error">
                {loginError}
              </SoftTypography>
            </SoftBox>
          )}

          <SoftBox mt={4} mb={1}>
            <SoftButton variant="gradient" color="info" fullWidth>
              <input
                type="submit"
                value="Iniciar Sesión"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                }}
              />
            </SoftButton>
          </SoftBox>
        </form>
      </SoftBox>
    </CoverLayout>
  );
};

export default SignIn;
