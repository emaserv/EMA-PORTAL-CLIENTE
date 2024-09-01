import * as React from 'react';
import SoftBox from 'components/SoftBox';
import ResponsiveAppBar from './components/responsiveAppBar';

import camionetas from "assets/images/Portal-Cliente-Images/top-10.jpg";

import { Link } from "react-router-dom";
import Grid from "@mui/material/Grid";

import './GradientBackground.css';
import SoftButton from 'components/SoftButton';

const Home = () => {

  return (
    <SoftBox alignItems="center">
      
      <SoftBox>
        <ResponsiveAppBar/>
      </SoftBox>
      
      <div className="gradient-background" style={{display: "flex", alignItems:"center" }}>
        <SoftBox marginLeft="2rem" marginTop="3rem">
          <Grid container spacing={3}>
            <Grid
              sx={{ textAlign: "left" }} // Centering the text
              item
              xs={10}
            >
              <div className="content" display="flex">            
                <SoftButton variant="gradient" color="info" size="large" sx={{width: '30rem'}} > Importador</SoftButton>
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

        <Grid
          container
          justifyContent="center"
          sx={{
            minHeight: "75vh",
            zIndex: -2
          }}
        >
          <Grid item xs={12} md={20}>
            <SoftBox
              height="100%"
              display={{ xs: "none", md: "block" }}
              position="relative"
              right={{ md: "-1rem", xl: "-1rem" }}
              mr={-16}
              sx={{
                transform: "skewX(-10deg)",
                overflow: "hidden",
                borderBottomLeftRadius: ({ borders: { borderRadius } }) => borderRadius.lg,
              }}
            >
              <SoftBox
                ml={-8}
                height="100%"
                sx={{
                  backgroundImage: `url(${camionetas})`,
                  backgroundSize: "cover",
                  transform: "skewX(10deg)",
                }}
              />
            </SoftBox>
          </Grid>
      </Grid>

      </div>
    </SoftBox>
  );
}
export default Home;