// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React components
import PageLayout from "components/LayoutContainers/PageLayout";

// Footer compartido por toda la app (mismo pie que el resto de las pantallas)
import Footer from "components/Footer";

function CoverLayout({ header, title, description, image, children }) {
  return (
    <PageLayout background="white">
      <SoftBox display="flex" flexDirection="column" sx={{ minHeight: "100vh" }}>
        <SoftBox
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            flex: "1 1 auto",
            background: "linear-gradient(180deg, #eef3ff 0%, #ffffff 55%)",
            px: 2,
            py: 6,
          }}
        >
          <Card
            sx={{
              width: "100%",
              maxWidth: "420px",
              p: 4,
              borderRadius: "20px",
            }}
          >
            {image && (
              <SoftBox display="flex" justifyContent="center" mb={3}>
                <SoftBox component="img" src={image} alt="Logo" sx={{ height: "3.5rem", width: "auto" }} />
              </SoftBox>
            )}

            {!header ? (
              <SoftBox textAlign="center" mb={3}>
                <SoftTypography variant="h5" fontWeight="bold" mb={0.5}>
                  {title}
                </SoftTypography>
                <SoftTypography variant="body2" color="text.secondary">
                  {description}
                </SoftTypography>
              </SoftBox>
            ) : (
              header
            )}

            {children}
          </Card>
        </SoftBox>

        <Footer />
      </SoftBox>
    </PageLayout>
  );
}

// Setting default values for the props of CoverLayout
CoverLayout.defaultProps = {
  header: "",
  title: "",
  description: "",
};

// Typechecking props for the CoverLayout
CoverLayout.propTypes = {
  header: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default CoverLayout;
