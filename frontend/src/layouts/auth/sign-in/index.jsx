import React, { useState } from 'react';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import CoverLayout  from 'layouts/auth/components/CoverLayout';
import logoEma from 'assets/images/Portal-Cliente-Images/Logo-ema.png';
import SoftInputBase from 'components/SoftInputBase';
import { useAuth } from 'layouts/auth/AuthContext'; // Importa el hook useAuth del contexto de autenticación

const SignIn = () => {
  const { handleSubmit, control, formState: { errors } } = useForm();
  const [loginError, setLoginError] = useState('');
  const { login } = useAuth(); // Obtén la función login del contexto de autenticación

  const onSubmit = async (data) => {
    if (!data.userName || !data.password) {
      setLoginError('Por favor, complete todos los campos.');
      return;
    }

    const formData = new FormData();
    formData.append('data', JSON.stringify(data));

    try {
      const response = await axios.post(`/api/login`, formData);
      if (response.status === 200) {
        const userData = response.data; // Supongamos que response.data tiene la estructura { usuarios: [...] }
        console.log("Datos completos:", userData.data, userData.data[0]);

         // Suponiendo que la API devuelve los datos del usuario en response.data
        login(userData.data[0]);  // Llama a la función de login del contexto con los datos del usuario
        document.location = '/home'; // Redirige al usuario después del inicio de sesión
      }
    } catch (error) {
      if (error.response) {
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
      title={"Bienvenido a" + "              " + "Portal Clientes"}
      description="Ingrese sus credenciales para iniciar sesión"
      image={logoEma}
      top="5rem"
    >
      <SoftBox sx={{alignItems: 'center'}}>
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
              rules={{ required: true }}
              render={({ field }) => (
                <SoftInputBase
                  type="text"
                  placeholder="Usuario"
                  field={field}
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
              rules={{ required: true }}
              render={({ field }) => (
                <SoftInputBase
                  type="password"
                  placeholder="Contraseña"
                  field={field}
                  
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
            <SoftButton variant="gradient" color="info" type="submit" fullWidth>
              Iniciar Sesion
            </SoftButton>
          </SoftBox>
        </form>
      </SoftBox>
    </CoverLayout>
  );
};

export default SignIn;
