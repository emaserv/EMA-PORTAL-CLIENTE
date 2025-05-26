import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import SoftBox from 'components/SoftBox';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import brand from "assets/images/Portal-Cliente-Images/Logo-ema.png";
import LogoNaturgy from "assets/images/Portal-Cliente-Images/logo-naturgy.png";
import SoftTypography from 'components/SoftTypography';
import { useAuth } from 'layouts/auth/AuthContext';

const pages = [];
const settings = ['Mi Perfil', 'Cerrar Sesion'];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout(); // Llama a la función de logout
    navigate('/authentication/login'); // Redirige a la página de login
  };

  return (
    <AppBar position="static" style={{background: 'white', position: 'fixed', zIndex:'1000'}}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          
          <SoftBox component={NavLink} to="/home" display="flex" alignItems="center" marginTop="0.8rem" marginBottom="0.8rem">
            {brand && <SoftBox component="img" src={brand} alt="Logo EMA SERVICIOS" width="13rem" marginLeft="-7rem"/>}
          </SoftBox>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              open={Boolean(anchorElNav)}
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page}
              </Button>
            ))}
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, marginRight: '-7rem' }}>
                {user ? <SoftTypography marginRight='1rem'> {user.nombre} {user.apellido}</SoftTypography> : <Link to="/authentication/sign-in"> <SoftTypography marginRight='1rem'>No estás logueado</SoftTypography> </Link>}
                <Avatar
                  alt="User"
                  src={user?.userName === "naturgy@ema" ? LogoNaturgy : "/static/images/avatar/2.jpg"}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  {setting === 'Cerrar Sesion' && (
                    <Link to="/authentication/login">
                      <SoftTypography
                sx={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={handleLogout}
              >
                {setting}
              </SoftTypography>
              </Link>
                  )}
                  {setting === 'Mi Perfil' && (
                    <SoftTypography sx={{ textAlign: 'center' }}>{setting}</SoftTypography>
                  )}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;