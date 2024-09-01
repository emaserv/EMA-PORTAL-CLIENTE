import * as React from 'react';
import SoftBox from 'components/SoftBox';
import ResponsiveAppBar from './components/responsiveAppBar';

import brand from "assets/images/PSM-Images/Logo-ema.png";

import { Link } from "react-router-dom";
import Grid from "@mui/material/Grid";

import './GradientBackground.css';
import SoftButton from 'components/SoftButton';

import { useSoftUIController, setOpenImportador } from "context";
import ImportadorSideBar from 'components/ImportadorSideBar';

const Home = () => {

  const [controller, dispatch] = useSoftUIController();

  const {openImportador} = controller;

  //Change the handleImportadorState state
  const handleImportadorState = () => setOpenImportador(dispatch, !openImportador);
  
  return (
    <SoftBox alignItems="center">
      
      <SoftBox>
        <ResponsiveAppBar/>
      </SoftBox>
      
      <ImportadorSideBar/>

      <div className="gradient-background" >
        <SoftBox marginLeft="2rem">
          <Grid container spacing={3}>
            <Grid
              sx={{ textAlign: "left" }} // Centering the text
              item
              xs={10}
            >
              <div className="content" display="flex">            
                <SoftButton variant="gradient" color="info" size="large" sx={{width: '30rem'}} onClick={handleImportadorState}> Importador</SoftButton>
              </div>
            </Grid>
            <Grid
              sx={{ textAlign: "left", marginTop: "1rem" }} // Centering the text
              item
              xs={10}
            >
              <div className="content" display="flex">
                <Link to="/fecha-cliente">
                  <SoftButton variant="gradient" color="info" size="large" sx={{width: '30rem'}}>Consulta por Cliente</SoftButton>
                </Link>
              </div>
            </Grid>
            <Grid
              sx={{ textAlign: "left", marginTop: "1rem"  }} // Centering the text
              item
              xs={10}
            >
              <div className="content" display="flex">
                <Link to="/radio-cliente">
                  <SoftButton variant="gradient" color="info" size="large" sx={{width: '30rem'}}>Consulta por Radio</SoftButton>
                </Link>
              </div>
            </Grid>
          </Grid>
        </SoftBox>
        <div className="image" style={{zIndex: '-1'}}>
          <SoftBox component="img" src={brand} alt="Logo EMA SERVICIOS" width='25rem' />
        </div>
      </div>
    </SoftBox>
  );
}
export default Home;