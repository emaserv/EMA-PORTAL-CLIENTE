import * as React from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "./components/responsiveAppBar";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

import styled from "styled-components";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DrawIcon from "@mui/icons-material/Draw";
import MapIcon from "@mui/icons-material/Map";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

import camionetas from "assets/images/Portal-Cliente-Images/camionetas2.jpg";

import { Link } from "react-router-dom";
import PopUp from "components/PopUp";
import Footer from "components/Footer";

import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DropFileInput from "components/DropFileInput";
import DropdownList from "components/DropdownList";


//IMPORTO URL BACK
import { useAuth } from "layouts/auth/AuthContext";


import {API_BACK} from '../../config'
import { apiClient } from 'services/api';
import { COLOR_MODAL_ERROR, COLOR_MODAL_SUCCESS } from "assets/uiConstants";


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

  // Estilo compartido por los botones del menu de inicio, para que quede
  // como una lista de navegacion prolija en vez de botones tipo CTA repetidos.
  const menuButtonSx = {
    justifyContent: "flex-start",
    textTransform: "none",
    fontSize: "0.9rem",
    py: 1.1,
    px: 2.25,
  };

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

      const response = await apiClient.post(`/api/upload`, formData);
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
      <SoftBox display="flex" flexDirection="column" alignItems="center">
        <SoftBox width="100%">
          <ResponsiveAppBar />
        </SoftBox>

        <SoftBox sx={{ width: "90%", mt: "20px", mb: 4 }}>
          <Card
            sx={{
              borderRadius: "20px",
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "440px 1fr" },
              height: { xs: "auto", sm: "calc(100vh - 220px)" },
              minHeight: { xs: "auto", sm: "500px" },
            }}
          >
            {user && (
              <SoftBox
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  overflowY: "auto",
                  p: { xs: 4, md: 4.5 },
                }}
              >
                <SoftTypography variant="h4" fontWeight="bold" mb={0.5}>
                  Hola, {user.nombre}
                </SoftTypography>
                <SoftTypography variant="body2" sx={{ color: "#8392ab" }} mb={2.5}>
                  ¿Qué necesitás hacer hoy?
                </SoftTypography>

                <Divider sx={{ mb: 2 }} />

                <SoftBox display="flex" flexDirection="column" gap={1.25}>
                  {user.idGrupoCliente === null && (
                    <SoftButton
                      variant="gradient"
                      color="info"
                      size="medium"
                      fullWidth
                      startIcon={<CloudUploadIcon />}
                      sx={menuButtonSx}
                      onClick={() => cambiarEstadoPopUp1(!estadoPopUp1)}
                    >
                      Importar Archivo
                    </SoftButton>
                  )}

                  {user.idGrupoCliente !== 2 && user.idGrupoCliente !== 7 && (
                    <SoftButton component={Link} to="/fecha-cliente" variant="gradient" color="info" size="medium" fullWidth startIcon={<PersonIcon />} sx={menuButtonSx}>
                      Consulta por Cliente
                    </SoftButton>
                  )}

                  {(user.idGrupoCliente === 2 || user?.userName === "imorales@emaservicios.com.ar") && (
                    <SoftButton component={Link} to="/acuse-cliente" variant="gradient" color="info" size="medium" fullWidth startIcon={<DescriptionIcon />} sx={menuButtonSx}>
                      Acuse Cliente
                    </SoftButton>
                  )}

                  {(user.idGrupoCliente === 4 || user.idGrupoCliente === 2) && (
                    <SoftButton component={Link} to="/consulta-emision" variant="gradient" color="info" size="medium" fullWidth startIcon={<EventNoteIcon />} sx={menuButtonSx}>
                      Consulta por Emision
                    </SoftButton>
                  )}

                  {user.idGrupoCliente !== 4 && user.idGrupoCliente !== 2 && user.idGrupoCliente !== 6 && (
                    <SoftButton component={Link} to="/radio-cliente" variant="gradient" color="info" size="medium" fullWidth startIcon={<LocationOnIcon />} sx={menuButtonSx}>
                      Consulta por Radio
                    </SoftButton>
                  )}

                  {user.idGrupoCliente !== 4 && user.idGrupoCliente !== 2 && user.idGrupoCliente !== 6 && user.idGrupoCliente !== 7 && (
                    <SoftButton component={Link} to="/consulta-firmas" variant="gradient" color="info" size="medium" fullWidth startIcon={<DrawIcon />} sx={menuButtonSx}>
                      Consulta por Firmas
                    </SoftButton>
                  )}

                  {user.idGrupoCliente === 1 && (
                    <SoftButton component={Link} to="/mapa-cliente" variant="gradient" color="info" size="medium" fullWidth startIcon={<MapIcon />} sx={menuButtonSx}>
                      Consulta por Mapa
                    </SoftButton>
                  )}

                  {user.esAdmin && (
                    <SoftButton component={Link} to="/admin/usuarios" variant="gradient" color="info" size="medium" fullWidth startIcon={<ManageAccountsIcon />} sx={menuButtonSx}>
                      Administrar Usuarios
                    </SoftButton>
                  )}
                </SoftBox>
              </SoftBox>
            )}

            <SoftBox
              sx={{
                display: { xs: "none", sm: "block" },
                height: "100%",
                width: "100%",
                backgroundImage: `linear-gradient(180deg, rgba(10, 20, 45, 0.12) 0%, rgba(10, 20, 45, 0.32) 100%), url(${camionetas})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </Card>
        </SoftBox>

        <Footer />
      </SoftBox>

      <PopUp
        estado={estadoPopUp1}
        cambiarEstado={cambiarEstadoPopUp1}
        titulo={"Importar Archivo"}
        mostrarHeader={true}
        mostrarOverlay={true}
        posicionModal={"center"}
        padding={"0px"}
        width={"460px"}
        height={"auto"}
        background={"linear-gradient(45deg, #0D47A1, #1976D2, #2196F3, #64B5F6, #BBDEFB)"}
        paddingTopEncabezado={"14px"}
      >
        <SoftBox sx={{ p: 2 }}>
          <SoftTypography variant="body2" color="text.secondary" mb={1}>
            Seleccione el formato del archivo y súbalo para procesarlo
          </SoftTypography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <SoftBox mb={1}>
              <SoftTypography component="label" variant="caption" fontWeight="medium" color="text.secondary">
                Formato
              </SoftTypography>
              <SoftBox mt={0.5}>
                <Controller
                  name="idFormato"
                  control={control}
                  defaultValue={null}
                  render={({ field }) => (
                    <DropdownList
                      onChange={(selectedValue) =>
                        field.onChange(selectedValue)
                      }
                      width="100%"
                      list={opciones}
                      placeholder="Tipo de Formato"
                      campoAMostrar="nombre"
                      campoID="id"
                    />
                  )}
                />
              </SoftBox>
            </SoftBox>

            <SoftBox mb={2}>
              <SoftTypography component="label" variant="caption" fontWeight="medium" color="text.secondary">
                Archivo
              </SoftTypography>
              <SoftBox mt={0.5}>
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
            </SoftBox>

            <SoftBox display="flex" justifyContent="flex-end">
              <SoftButton variant="gradient" color="info" type="submit" sx={{ minWidth: '140px', py: 1 }}>
                Cargar Archivo
              </SoftButton>
            </SoftBox>
          </form>
        </SoftBox>
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
        background={COLOR_MODAL_ERROR}
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
        background={COLOR_MODAL_SUCCESS}
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
