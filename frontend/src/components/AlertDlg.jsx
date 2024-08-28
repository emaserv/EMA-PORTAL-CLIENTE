import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import PropTypes from 'prop-types';

export default function AlertDlg({titulo, open, setOpen}) {

  const handleClickOpen = () => {
    setOpen(true);
  };

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
      >
        <DialogTitle id="alert-dialog-title">
          {"PSM Web"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {titulo}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Aceptar</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

AlertDlg.propTypes = {
    titulo: PropTypes.string,
    open: PropTypes.boolean,
    setOpen: PropTypes.func,
  };