import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import PropTypes from 'prop-types';
import { GRADIENT_MODAL_HEADER, COLOR_ICON_ACTIVE } from 'assets/uiConstants';

export default function AlertDlg({titulo, open, setOpen}) {

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{ sx: { borderRadius: "15px", overflow: "hidden" } }}
      >
        <DialogTitle
          id="alert-dialog-title"
          sx={{ background: GRADIENT_MODAL_HEADER, color: "#ffffff", fontWeight: "bold" }}
        >
          EMA Servicios
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText id="alert-dialog-description">
            {titulo}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: COLOR_ICON_ACTIVE, fontWeight: "bold" }}>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

AlertDlg.propTypes = {
    titulo: PropTypes.string,
    open: PropTypes.bool,
    setOpen: PropTypes.func,
  };