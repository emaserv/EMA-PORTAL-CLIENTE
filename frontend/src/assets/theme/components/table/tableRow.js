// Soft UI Dashboard React base styles
import colors from "assets/theme/base/colors";

const { grey } = colors;

const tableRow = {
  styleOverrides: {
    root: {
      transition: "background-color 150ms ease",

      "&:hover": {
        backgroundColor: grey[100],
      },
    },
  },
};

export default tableRow;
