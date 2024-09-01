// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import { API_BACK } from "config";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";

// Authentication layout components
import CoverLayout from "layouts/auth/components/CoverLayout";

// Imagenes
import logoPSM from "assets/images/PSM-Images/PSM2.svg";
import SoftInputBase from "components/SoftInputBase";

const SignIn = ({ setToken }) => {
  const { handleSubmit, control } = useForm();

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    console.log(formData);

    const response = await axios.post(`${API_BACK}/api/login`, formData);
    //setToken(response.data.access_token);
    
    if (response.status === 200) document.location = "/home";

    //if (response.status === 401 ) que chequee si los campos estan llenos y si no que ponga que la contrasenia y o nom usuario tan mal 
    //if (response.status === 500 ) que chequee si los campos estan llenos y si no que ponga que la contrasenia y o nom usuario tan mal 
 
  };


  return (
    <CoverLayout
      title="Bienvenido a Portal Clientes!"
      description="Ingrese sus credenciales para iniciar sesión"
      image={logoPSM}
    >
      <SoftBox >
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
            {
              //Estas propiedades las tengo que hardcodear porque si no otra clase me las sobreescribe
            }
            <Controller
              name="userName"
              control={control}
              render={({ field }) => (
                <SoftInputBase
                  type="text"
                  placeholder="User"
                  field = {field}
                  sx={{
                    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
                    letterSpacing: "0.00938em",
                    boxSizing: "border-box",
                    position: "relative",
                    cursor: "text",
                    webkitBoxAlign: "center",
                    padding: "0.5rem 0.75rem",
                    border: "0.0625rem solid rgb(210, 214, 218)",
                    borderRadius: "0.5rem",
                    pointerEvents: "auto",
                    display: "grid !important",
                    placeItems: "center !important",
                    width: "100% !important",
                    height: "auto !important",
                    fontSize: "0.875rem !important",
                    fontWeight: "400 !important",
                    lineHeight: "1.4 !important",
                    color: "rgb(73, 80, 87) !important",
                    backgroundColor: "rgb(255, 255, 255) !important",
                    backgroundClip: "padding-box !important",
                    appearence: "none !important",
                    transition:
                      "box-shadow 150ms ease 0s, border-color 150ms ease 0s, padding 150ms ease 0s !important",

                    "& input": {
                      paddingTop: "0px",
                      paddingBottom: "0px",
                    },
                  }}
                />
              )}
            />
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

            {
              //Estas propiedades las tengo que hardcodear porque si no otra clase me las sobreescribe
            }
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <SoftInputBase
                  type="password"
                  placeholder="Contraseña"
                  field = {field}
                  sx={{
                    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
                    letterSpacing: "0.00938em",
                    boxSizing: "border-box",
                    position: "relative",
                    cursor: "text",
                    webkitBoxAlign: "center",
                    padding: "0.5rem 0.75rem",
                    border: "0.0625rem solid rgb(210, 214, 218)",
                    borderRadius: "0.5rem",
                    pointerEvents: "auto",
                    display: "grid !important",
                    placeItems: "center !important",
                    width: "100% !important",
                    height: "auto !important",
                    fontSize: "0.875rem !important",
                    fontWeight: "400 !important",
                    lineHeight: "1.4 !important",
                    color: "rgb(73, 80, 87) !important",
                    backgroundColor: "rgb(255, 255, 255) !important",
                    backgroundClip: "padding-box !important",
                    appearence: "none !important",
                    transition:
                      "box-shadow 150ms ease 0s, border-color 150ms ease 0s, padding 150ms ease 0s !important",

                    "& input": {
                      paddingTop: "0px",
                      paddingBottom: "0px",
                    },
                  }}
                />
              )}
            />
          </SoftBox>

          <SoftBox mt={4} mb={1}>
            {
              // Esto es para redirigir a dashboard cuando haces click
            }
            
              <SoftButton variant="gradient" color="info" fullWidth>
                <input type="submit" value="Iniciar Sesion"
                  style={{
                    background: "transparent",
                    border: "none",
                    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                    fontSize: "0.875rem",
                    fontWeight: "700",
                    color: "#FFFFFF",
                    textTransform: "uppercase",
                  }}
                />
              </SoftButton>
          </SoftBox>
        </form>
      </SoftBox>
    </CoverLayout>
  );
}

export default SignIn;
