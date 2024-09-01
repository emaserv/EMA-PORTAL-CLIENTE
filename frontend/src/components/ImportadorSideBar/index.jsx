/**
=========================================================
* Soft UI Dashboard React - v4.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";

// @mui material components
import Icon from "@mui/material/Icon";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

// Custom styles for the Configurator
import ImportadorSideBarRoot from "components/ImportadorSideBar/ImportadorSideBarRoot";

// Soft UI Dashboard React context
import {
  useSoftUIController,
  setOpenImportador,
  setTransparentSidenav,
  setFixedNavbar,
  setSidenavColor,
} from "context";

import { scale } from "chroma-js";

function ImportadorSideBar() {
  const [controller, dispatch] = useSoftUIController();
  const { openImportadorBar } = controller;
  const [disabled, setDisabled] = useState(false);

  // Use the useEffect hook to change the button state for the sidenav type based on window size.
  useEffect(() => {
    // A function that sets the disabled state of the buttons for the sidenav type.
    function handleDisabled() {
      return window.innerWidth > 1200 ? setDisabled(false) : setDisabled(true);
    }

    // The event listener that's calling the handleDisabled function when resizing the window.
    window.addEventListener("resize", handleDisabled);

    // Call the handleDisabled function to set the state with the initial value.
    handleDisabled();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleDisabled);
  }, []);

  const handleCloseImportadorBar = () => setOpenImportador(dispatch, false); 

  return (
    <ImportadorSideBarRoot variant="permanent" ownerState={{ openImportadorBar }}>
      <SoftBox
        display="flex"
        justifyContent="space-between"
        alignItems="baseline"
        pt={0.5}
        pb={0.8}
      >
        <SoftBox>
          <SoftTypography variant="h5">Clima</SoftTypography>
        </SoftBox>

        <Icon
          sx={({ typography: { size, fontWeightBold }, palette: { dark } }) => ({
            fontSize: `${size.md} !important`,
            fontWeight: `${fontWeightBold} !important`,
            stroke: dark.main,
            strokeWidth: "2px",
            cursor: "pointer",
            mt: 2,
          })}
          onClick={handleCloseImportadorBar}
        >
          close
        </Icon>
      </SoftBox>

      <SoftBox>
        <iframe 
          src="https://www.meteoblue.com/es/weather/widget/three/buenos-aires_argentina_3435910?geoloc=fixed&amp;nocurrent=0&amp;noforecast=0&amp;days=6&amp;tempunit=CELSIUS&amp;layout=image" 
          frameBorder="0" 
          scrolling="NO" 
          sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox" 
          style={{width: '100%', height: '520px'}}
        />
      </SoftBox>

      <SoftBox>
      <iframe 
          src="https://www.rainviewer.com/map.html?loc=-34.6253,-58.4339,11&oFa=0&oC=0&oU=0&oCS=0&oF=0&oAP=1&c=3&o=83&lm=0&layer=radar&sm=1&sn=0&hu=false"
          frameBorder="0" 
          scrolling="NO"
          sandbox="allow-same-origin allow-scripts" 
          style={{width: '100%', height: '230%'}}
        />
      </SoftBox>
    </ImportadorSideBarRoot>
  );
}

export default ImportadorSideBar;
