// Constantes visuales compartidas para mantener una sola identidad en toda la app.
// No contienen logica de negocio: solo colores/estilos reutilizados en tablas y popups.

export const GRADIENT_TABLE_HEADER = "linear-gradient(to top, #2152ff, #21d4fd)";
// Header distintivo para las tablas de "informacion Metro" (a pedido: mantener el verde original)
export const GRADIENT_TABLE_HEADER_METRO = "linear-gradient(to top, #006400, #32CD32)";
export const GRADIENT_MODAL_HEADER =
  "linear-gradient(45deg, #0D47A1, #1976D2, #2196F3, #64B5F6, #BBDEFB)";
export const COLOR_MODAL_ERROR = "#ea0606"; // theme colors.error.main
export const COLOR_MODAL_SUCCESS = "#82d616"; // theme colors.success.main
export const COLOR_ICON_ACTIVE = "#2152ff";
export const COLOR_ICON_DISABLED = "#D3D3D3";
export const COLOR_TEXT_MUTED = "#8392ab";

// Estilo de tarjeta compartido por las pantallas internas (mismo look que el
// AppBar y la Card de Home): bordes bien redondeados, borde muy claro y
// sombra suave, en vez del Card por defecto de MUI (mas chato y con borde
// gris marcado). Usar en toda Card de "seccion" para que todas las pantallas
// se vean consistentes entre si.
export const SECTION_CARD_SX = {
  borderRadius: "20px",
  border: "1px solid #eef0f4",
  boxShadow: "0 8px 24px rgba(20, 30, 60, 0.08)",
};

export const TABLE_HEADER_CELL_SX = {
  background: GRADIENT_TABLE_HEADER,
  fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
  fontSize: "0.85rem",
  fontWeight: "700",
  color: "#ffffff",
  textTransform: "uppercase",
  padding: "10px 16px",
  border: "none",
  "&:first-of-type": { borderTopLeftRadius: "16px" },
  "&:last-of-type": { borderTopRightRadius: "16px" },
};
