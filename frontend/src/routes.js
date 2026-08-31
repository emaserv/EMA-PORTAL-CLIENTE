/* 
  All of the routes for the Soft UI Dashboard React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Soft UI Dashboard React layouts
import SignIn from "./layouts/auth/sign-in";
import FechaCliente from "./layouts/fechaCliente";
import Home from "./layouts/home";
import RutaCliente from "./layouts/radioCliente";
import ConsultaFirmas from "./layouts/firmasCliente"
import InformesCliente from "layouts/informesCliente";
import AcuseCliente from "layouts/acuseCliente";
import MapaCliente from "layouts/mapaCliente";
import AdminUsuarios from "layouts/adminUsuarios";

const routes = [
  {
    name: "Home",
    key: "home",
    route: "/home",
    component: <Home />,
  },  
  {
    type: "collapse",
    name: "Wiki",
    key: "sign-in",
    route: "/authentication/sign-in",
    component: <SignIn />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Fecha Cliente",
    key: "fecha-cliente",
    route: "/fecha-cliente",
    component: <FechaCliente />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Radio Cliente",
    key: "radio-cliente",
    route: "/radio-cliente",
    component: <RutaCliente />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Consulta por Firmas", 
    key: "consulta-firmas",
    route: "/consulta-firmas",
    component: <ConsultaFirmas />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Consulta por Firmas", 
    key: "consulta-emision",
    route: "/consulta-emision",
    component: <InformesCliente />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Acuse Cliente",
    key: "acuse-cliente",
    route: "/acuse-cliente",
    component: <AcuseCliente />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Mapa Cliente",
    key: "mapa-cliente",
    route: "/mapa-cliente",
    component: <MapaCliente />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Administrar Usuarios",
    key: "admin-usuarios",
    route: "/admin/usuarios",
    component: <AdminUsuarios />,
    noCollapse: true,
    adminOnly: true,
  },
];

export default routes;