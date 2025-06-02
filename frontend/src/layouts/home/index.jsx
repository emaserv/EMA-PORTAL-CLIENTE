import * as React from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "./components/responsiveAppBar";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

import styled from "styled-components";

import camionetas from "assets/images/Portal-Cliente-Images/camionetas2.jpg";

import { Link } from "react-router-dom";
import Grid from "@mui/material/Grid";
import PopUp from "components/PopUp";

import "./GradientBackground.css";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DropFileInput from "components/DropFileInput";
import DropdownList from "components/DropdownList";

import axios from "axios";

//IMPORTO URL BACK
import { useAuth } from "layouts/auth/AuthContext";


import {API_BACK} from '../../config'


const Home = () => {
  const [estadoPopUp1, cambiarEstadoPopUp1] = useState(false);
  const [fallo, cambiarEstadoPopUpFallo] = useState(false);
  const [correct, cambiarEstadoPopUpCorrect] = useState(false);
  const [fileName, setFileName] = useState(null);
  const { handleSubmit, control } = useForm();
  const { user } = useAuth();

  // Estado para la pantalla de cargas de los archivos
  const [loading, setLoading] = useState(false);

  const opciones = [
    { id: 1, nombre: "PSM" },
    { id: 2, nombre: "EMASERVICIOS" },
    { id: 3, nombre: "DAI"},
  ];

  //CAMBIAR ESTA FUNCION
  const onSubmit = async (data) => {
    cambiarEstadoPopUp1(false);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", fileName);
      formData.append(
        "data",
        JSON.stringify({
          idFormato: data.idFormato,
          file: data.file,
        })
      );

      // Imprimir el contenido del FormData
      for (const [key, value] of formData.entries()) {
        //console.log(`${key}:`, value);
      }

      const response = await axios.post(`/api/upload`, formData);
      //console.log("response", response)

      if(response.status === 200){
        setLoading(false);
        cambiarEstadoPopUpCorrect(true);
      }
      setFileName(null);
    } catch (error) {
      console.error("Error completo:", error);
      setLoading(false);
      cambiarEstadoPopUpFallo(true);
    }
  };

  // Manejo de recarga de página
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <>
      <SoftBox alignItems="center">
        <SoftBox>
          <ResponsiveAppBar />
        </SoftBox>

        <div
          className="gradient-background"
          style={{ display: "flex", alignItems: "center" }}
        >
          <SoftBox marginTop="3rem">
            {user ? (
              <Grid
                container
                spacing={3}
                marginLeft="7rem"
                marginRight="-15rem"
              >
                {user && user.idGrupoCliente === null ? (
                  <Grid
                    sx={{ textAlign: "left" }} // Centering the text
                    item
                    xs={10}
                  >
                    <div className="content" display="flex">
                      <SoftButton
                        variant="gradient"
                        color="info"
                        size="large"
                        sx={{ width: "30rem" }}
                        onClick={() => cambiarEstadoPopUp1(!estadoPopUp1)}
                      >
                        Importar Archivo
                      </SoftButton>
                    </div>
                  </Grid>
                ) : null}

                

                {user && user.idGrupoCliente !== 2 ? (
                <Grid
                  sx={{ textAlign: "left", marginTop: "1rem" }} // Centering the text
                  item
                  xs={12}
                >
                  <div className="content" display="flex">
                    <Link to="/fecha-cliente">
                      <SoftButton
                        variant="gradient"
                        color="info"
                        size="large"
                        sx={{ width: "30rem" }}
                      >
                        Consulta por Cliente
                      </SoftButton>
                    </Link>
                  </div>
                </Grid>)
                : null}

                {user && user.idGrupoCliente == 2 ?(
                <Grid
                  sx={{ textAlign: "left", marginTop: "1rem" }} // Centering the text
                  item
                  xs={12}
                >
                  <div className="content" display="flex">
                    <Link to="/acuse-cliente">
                      <SoftButton
                        variant="gradient"
                        color="info"
                        size="large"
                        sx={{ width: "30rem" }}
                      >
                        Acuse Cliente
                      </SoftButton>
                    </Link>
                  </div>
                </Grid>) : null}

                {user && (user.idGrupoCliente === 4 || user.idGrupoCliente === 2) ? (
                <Grid
                  sx={{ textAlign: "left", marginTop: "1rem" }} // Centering the text
                  item
                  xs={12}
                >
                  <div className="content" display="flex">
                    <Link to="/consulta-emision">
                      <SoftButton
                        variant="gradient"
                        color="info"
                        size="large"
                        sx={{ width: "30rem" }}
                      >
                        Consulta por Emision
                      </SoftButton>
                    </Link>
                  </div>
                </Grid>)
                : null}

                {user && (user.idGrupoCliente !== 4 && user.idGrupoCliente !== 2) ? (
                  <Grid
                    sx={{ textAlign: "left", marginTop: "1rem" }} // Centering the text
                    item
                    xs={12}
                  >
                    <div className="content" display="flex">
                      <Link to="/radio-cliente">
                        <SoftButton
                          variant="gradient"
                          color="info"
                          size="large"
                          sx={{ width: "30rem" }}
                        >
                          Consulta por Radio
                        </SoftButton>
                      </Link>
                    </div>
                  </Grid>
                ) : null}

                {user && (user.idGrupoCliente !== 4 && user.idGrupoCliente !== 2) ? (
                <Grid
                    sx={{ textAlign: "left", marginTop: "1rem" }} // Centrado del texto
                    item
                    xs={12}
                  >
                    <div className="content" display="flex">
                      <Link to="/consulta-firmas">
                        <SoftButton
                          variant="gradient"
                          color="info"
                          size="large"
                          sx={{ width: "30rem" }}
                        >
                          Consulta por Firmas
                        </SoftButton>
                      </Link>
                    </div>
                  </Grid>
                  ) : null}

              </Grid>             
              
            ) : null}
          </SoftBox>

          <Grid
            container
            justifyContent="center"
            sx={{
              height: "100vh", // Establece la altura del contenedor al 100% de la altura de la ventana
              overflow: "hidden", // Evita el desbordamiento si la imagen es más grande que el contenedor
              zIndex: -2,
              position: "relative", // Asegúrate de que el contenedor tenga un contexto de posición
            }}
          >
            <Grid item xs={12}>
              <SoftBox
                height="100%" // Asegúrate de que el SoftBox ocupe el 100% de la altura del contenedor
                display={{ xs: "none", md: "block" }}
                position="absolute"
                right={{ md: "-2rem", xl: "-5rem" }}
                mr={-16}
                sx={{
                  transform: "skewX(-10deg)",
                  overflow: "hidden",
                  borderBottomLeftRadius: ({ borders: { borderRadius } }) =>
                    borderRadius.lg,
                }}
              >
                <SoftBox
                  ml={-72}
                  height="100%"
                  width="100vw"
                  sx={{
                    position: "relative",
                    backgroundImage: `url(${camionetas})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    maskImage:
                      "linear-gradient(45deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)", // Aplica el degradado a la máscara
                    maskSize: "cover",
                    maskPosition: "center",
                    maskRepeat: "no-repeat",
                    transform: "skewX(10deg)",
                  }}
                />
              </SoftBox>
            </Grid>
          </Grid>
        </div>
      </SoftBox>

      <PopUp
        estado={estadoPopUp1}
        cambiarEstado={cambiarEstadoPopUp1}
        titulo={"Importador"}
        mostrarHeader={true}
        mostrarOverlay={true}
        posicionModal={"center"}
        padding={"0px"}
        width={"60vw"}
        height={"58vh"}
        background={
          "linear-gradient(45deg, #0D47A1, #1976D2, #2196F3, #64B5F6, #BBDEFB)"
        }
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Contenido>
            <SoftBox
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              pt={1}
            >
              <SoftTypography
                variant="button"
                fontWeight="medium"
                color="dark"
                px={1}
              >
                Formato
              </SoftTypography>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Controller
                  name="idFormato"
                  control={control}
                  defaultValue={null}
                  render={({ field }) => (
                    <DropdownList
                      onChange={(selectedValue) =>
                        field.onChange(selectedValue)
                      }
                      width="30vw"
                      list={opciones}
                      placeholder="Tipo de Formato"
                      campoAMostrar="nombre"
                      campoID="id"
                    />
                  )}
                />
              </SoftBox>
            </SoftBox>

            <SoftBox
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              pt={1}
            >
              <Controller
                name="file"
                control={control}
                defaultValue={null}
                render={({ field }) => (
                  <DropFileInput
                    field={field}
                    setFileName={setFileName}
                    fileName={fileName ? fileName.name : "init"}
                  />
                )}
              />
            </SoftBox>

            <SoftButton
              variant="gradient"
              color="info"
              style={{
                marginTop: "20px",
                background:
                  "linear-gradient(45deg, #0D47A1, #1976D2, #2196F3, #64B5F6, #BBDEFB)",
              }}
            >
              <input
                type="submit"
                value="Cargar Archivo"
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
          </Contenido>
        </form>
      </PopUp>

      <PopUp
        estado={loading}
        mostrarHeader={false}
        mostrarOverlay={true}
        posicionModal={"center"}
        padding={"0px"}
        width={"30vw"}
        height={"10vh"}
      >
        <Contenido>
          <SoftTypography
            variant="button"
            fontWeight="medium"
            color="dark"
            alignItems="center"
            justifyContent="center"
            px={3}
            py={2.5}
          >
            Aguarde, su archivo esta siendo cargado...
          </SoftTypography>
        </Contenido>
      </PopUp>

      <PopUp
        estado={fallo}
        cambiarEstado={cambiarEstadoPopUpFallo}
        titulo=""
        mostrarHeader={true}
        mostrarOverlay={true}
        posicionModal={"center"}
        padding={"0px"}
        width={"30vw"}
        height={"15vh"}
        background={"#FF0000"}
        paddingTopEncabezado={'20px'}
      >
        <Contenido>
          <SoftTypography
            variant="button"
            fontWeight="medium"
            color="dark"
            alignItems="center"
            justifyContent="center"
            px={3}
            py={2}
          >
            Lo sentimos, ocurrio un error al intentar cargar su archivo.
          </SoftTypography>
        </Contenido>
      </PopUp>

      <PopUp
        estado={correct}
        cambiarEstado={cambiarEstadoPopUpCorrect}
        titulo=""
        mostrarHeader={true}
        mostrarOverlay={true}
        posicionModal={"center"}
        padding={"0px"}
        width={"30vw"}
        height={"10vh"}
        background={"#00FF00"}
        paddingTopEncabezado={'20px'}
      >
        <Contenido>
          <SoftTypography
            variant="button"
            fontWeight="medium"
            color="dark"
            alignItems="center"
            justifyContent="center"
            px={3}
            py={2}
          >
            Archivo cargado correctamente.
          </SoftTypography>
        </Contenido>
      </PopUp>
    </>
  );
};

export default Home;

const Contenido = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  h1 {
    font-size: 42px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  p {
    font-size: 18px;
    margin-bottom: 20px;
  }

  img {
    width: 100%;
    vertical-align: top;
    border-radius: 3px;
  }
`;
