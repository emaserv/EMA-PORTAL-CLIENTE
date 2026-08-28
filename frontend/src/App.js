import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "assets/theme";
import routes from "routes";
import { useAuth } from "layouts/auth/AuthContext";
import ProtectedRoute from "layouts/auth/protectedRoute";

// Rutas permitidas por idGrupoCliente
// Agregar nuevos grupos aqui si se necesitan mas restricciones en el futuro
const RUTAS_PERMITIDAS_POR_GRUPO = {
  7: ["/home", "/radio-cliente"],  // EDESUR-RADIO: solo Consulta por Radio
};

const SIGN_IN_ROUTE = "/authentication/sign-in";

export default function App() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  // Devuelve el elemento de la ruta protegido por login y, si corresponde,
  // por la restriccion de rutas del grupo del usuario logueado.
  const getGuardedElement = (route) => {
    if (route.route === SIGN_IN_ROUTE) {
      return route.component;
    }

    const rutasPermitidas = RUTAS_PERMITIDAS_POR_GRUPO[user?.idGrupoCliente];
    if (rutasPermitidas && !rutasPermitidas.includes(route.route)) {
      return <Navigate to="/home" replace />;
    }

    return <ProtectedRoute element={route.component} />;
  };

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return (
          <Route
            exact
            path={route.route}
            element={getGuardedElement(route)}
            key={route.key}
          />
        );
      }

      return null;
    });

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Routes>
        {getRoutes(routes)}
        <Route path="*" element={<Navigate to={SIGN_IN_ROUTE} />} />
      </Routes>
    </ThemeProvider>
  );
}
