import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function Footer() {
  const anioActual = new Date().getFullYear();

  return (
    <SoftBox
      component="footer"
      sx={{
        width: "100%",
        py: 2,
        mt: "auto",
        textAlign: "center",
      }}
    >
      <SoftTypography variant="caption" sx={{ color: "#8392ab" }}>
        © {anioActual} EMA Servicios S.A. — Portal Cliente. R.N.P.S.P. N° 95
      </SoftTypography>
    </SoftBox>
  );
}

export default Footer;
