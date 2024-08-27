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

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React base styles
import typography from "./base/typography";

function Footer({ company, links }) {
  const { size } = typography;

  return (
    <SoftBox
      width="100%"
      display="flex"
      flexDirection={{ xs: "column", lg: "row" }}
      justifyContent="space-between"
      alignItems="center"
      px={1.5}
    >
      <SoftBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
        color="text"
        fontSize={size.sm}
        px={1.5}
      >
        &copy; {new Date().getFullYear()},
        <SoftBox fontSize={size.sm} color="text" mb={0} mx={0.25}>
          <SoftTypography variant="button" fontWeight="medium">
            &nbsp;PSM
          </SoftTypography>
        </SoftBox>
        <SoftBox fontSize={size.md} color="text" mb={-0.4} mx={0.25}>
          <Icon color="inherit" fontSize="inherit">
            mail
          </Icon>
        </SoftBox>
        &nbsp;by
        <SoftBox fontSize={size.sm} color="text" mb={0} mx={0.25}>
          <SoftTypography variant="button" fontWeight="medium">
            &nbsp;EMA SERVICIOS S.A. - R.N.P.S.P. N° 95&nbsp;
          </SoftTypography>
        </SoftBox>
      </SoftBox>
      <SoftBox
        component="ul"
        sx={({ breakpoints }) => ({
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          listStyle: "none",
          mt: 3,
          mb: 0,
          p: 0,

          [breakpoints.up("lg")]: {
            mt: 0,
          },
        })}
      >
      </SoftBox>
    </SoftBox>
  );
}

// Setting default values for the props of Footer

// Typechecking props for the Footer
Footer.propTypes = {
  company: PropTypes.objectOf(PropTypes.string),
  links: PropTypes.arrayOf(PropTypes.object),
};

export default Footer;
