import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import LogoutIcon from '@mui/icons-material/Logout';
import SoftBox from 'components/SoftBox';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import brand from "assets/images/Portal-Cliente-Images/Logo-ema.png";
import LogoEma from "assets/images/Portal-Cliente-Images/logoema3.jpg";
import LogoNaturgy from "assets/images/Portal-Cliente-Images/logo-naturgy.png";
import LogoMetrogas from "assets/images/Portal-Cliente-Images/logometrogas.png";
import LogoEdesur from "assets/images/Portal-Cliente-Images/logoedesur.png";
import LogoAysa from "assets/images/Portal-Cliente-Images/logoaysa-centrado.png";
import LogoEcogas from "assets/images/Portal-Cliente-Images/logoecogas.png";
import SoftTypography from 'components/SoftTypography';
import { useAuth } from 'layouts/auth/AuthContext';
import { COLOR_ICON_ACTIVE } from 'assets/uiConstants';

// Logo a mostrar en el avatar segun el grupo de cliente del usuario logueado.
// Si un grupo no tiene logo cargado aca, se muestran las iniciales del usuario.
const LOGO_POR_GRUPO_CLIENTE = {
  1: LogoEdesur,
  2: LogoNaturgy,
  3: LogoAysa,
  4: LogoMetrogas,
  5: LogoEma,
  6: LogoEcogas,
  7: LogoEdesur,
};

const getInitials = (nombre, apellido) => {
  const inicialNombre = nombre?.trim()?.[0] || "";
  const inicialApellido = apellido?.trim()?.[0] || "";
  return (inicialNombre + inicialApellido).toUpperCase() || "?";
};

function ResponsiveAppBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout(); // Llama a la función de logout (limpia la cookie de sesión)
    navigate('/authentication/sign-in');
  };

  // Sin idGrupoCliente (usuarios internos de EMA) se agrupan con el logo de EMA.
  const logoCliente = user
    ? (user.idGrupoCliente == null ? LogoEma : LOGO_POR_GRUPO_CLIENTE[user.idGrupoCliente])
    : undefined;

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        mt: { xs: '14px', md: '24px' },
        mx: '5%',
        width: 'auto',
        background: 'white',
        zIndex: 1000,
        borderRadius: '20px',
        border: '1px solid #eef0f4',
        boxShadow: '0 8px 24px rgba(20, 30, 60, 0.08)',
      }}
    >
      <Toolbar
        sx={{
          minHeight: '5.75rem',
          px: { xs: 4, sm: 5, md: 7, lg: 9, xl: 12 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <SoftBox component={NavLink} to="/home" display="flex" alignItems="center">
          {brand && (
            <SoftBox component="img" src={brand} alt="Logo EMA SERVICIOS" sx={{ height: '3rem', width: 'auto' }} />
          )}
        </SoftBox>

        {user ? (
          <SoftBox
            onClick={handleLogout}
            display="flex"
            alignItems="center"
            sx={{
              cursor: 'pointer',
              gap: 1,
              py: 0.5,
              pl: 1,
              pr: 1.5,
              borderRadius: '999px',
              backgroundColor: '#f4f6fa',
              border: '1px solid transparent',
              transition: 'border-color 0.15s ease',
              '&:hover': { borderColor: COLOR_ICON_ACTIVE },
            }}
          >
            <Avatar
              alt={`${user.nombre} ${user.apellido}`}
              src={logoCliente ?? undefined}
              sx={{
                width: 36,
                height: 36,
                bgcolor: logoCliente ? 'white' : COLOR_ICON_ACTIVE,
                border: logoCliente ? '1px solid #eef0f4' : 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              {!logoCliente && getInitials(user.nombre, user.apellido)}
            </Avatar>
            <SoftTypography variant="button" fontWeight="medium" sx={{ lineHeight: 1.1 }}>
              {user.nombre} {user.apellido}
            </SoftTypography>
            <LogoutIcon sx={{ fontSize: '1.1rem', color: '#8392ab' }} />
          </SoftBox>
        ) : (
          <SoftBox component={Link} to="/authentication/sign-in">
            <SoftTypography variant="button" fontWeight="medium" color="info">
              Iniciar sesión
            </SoftTypography>
          </SoftBox>
        )}
      </Toolbar>
    </AppBar>
  );
}
export default ResponsiveAppBar;
