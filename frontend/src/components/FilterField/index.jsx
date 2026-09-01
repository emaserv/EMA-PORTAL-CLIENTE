import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Envoltorio comun para los campos de los paneles de "Filtros".
// Cada campo tiene exactamente la misma forma (label + input + linea de error
// de altura reservada), asi los campos de una misma fila quedan alineados
// entre si sin necesidad de margenes negativos ajustados a mano por campo.
function FilterField({ label, children, error, width, hideLabel }) {
  return (
    <SoftBox display="flex" flexDirection="column" sx={{ width }}>
      <SoftTypography
        component="label"
        variant="caption"
        fontWeight="regular"
        mb={0.5}
        sx={hideLabel ? { visibility: "hidden" } : undefined}
      >
        {label}
      </SoftTypography>
      {children}
      {!hideLabel && (
        <SoftTypography
          color="error"
          fontSize="0.75rem"
          sx={{ minHeight: "1.1rem", display: "block", mt: 0.5 }}
        >
          {error || ""}
        </SoftTypography>
      )}
    </SoftBox>
  );
}

FilterField.propTypes = {
  label: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  error: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  // Reserva el mismo alto de label pero sin mostrar texto ni linea de error.
  // Sirve para alinear elementos que no son "campos" (ej. el boton Filtrar)
  // a la misma altura de input que el resto de la fila.
  hideLabel: PropTypes.bool,
};

FilterField.defaultProps = {
  error: "",
  width: undefined,
  hideLabel: false,
};

export default FilterField;
