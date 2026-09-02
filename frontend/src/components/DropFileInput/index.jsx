import React, { useCallback } from 'react';
import Typography from '@mui/material/Typography';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Paper from '@mui/material/Paper';

import PropTypes from 'prop-types';
import { COLOR_ICON_ACTIVE } from 'assets/uiConstants';

const DropFileInput = (props) => {
  const archivoSeleccionado = props.fileName !== "init";

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const handleFile = async (file) => {
    props.setFileName(file);
    props.field.onChange(file.name)
  };

  const preventDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Paper
      elevation={0}
      component="label"
      htmlFor="fileInput"
      onDrop={handleDrop}
      onDragEnter={preventDefaults}
      onDragOver={preventDefaults}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        py: 2.5,
        px: 3,
        borderRadius: 2,
        cursor: 'pointer',
        border: '2px dashed',
        borderColor: archivoSeleccionado ? COLOR_ICON_ACTIVE : '#e0e0e0',
        width: '100%',
        backgroundColor: archivoSeleccionado ? 'rgba(33, 82, 255, 0.04)' : '#f8f9fa',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: COLOR_ICON_ACTIVE,
          backgroundColor: 'rgba(33, 82, 255, 0.04)',
        },
      }}
    >
      {archivoSeleccionado ? (
        <>
          <input
            type="file"
            id="fileInput"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <CloudUploadIcon sx={{ fontSize: 40, color: COLOR_ICON_ACTIVE, mb: 0.5 }} />
          <Typography variant="body2" fontWeight="medium" color="info">
            {props.fileName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Archivo listo para procesar
          </Typography>
        </>
      ) : (
        <>
          <input
            type="file"
            id="fileInput"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <CloudUploadIcon sx={{ fontSize: 40, color: '#9e9e9e' }} />
          <Typography variant="body2" color="text.secondary">
            Arrastre o haga clic para seleccionar un archivo
          </Typography>
        </>
      )}
    </Paper>
  );
};

export default DropFileInput;

DropFileInput.propTypes = {
  setFileName: PropTypes.func,
  fileName: PropTypes.string,
  field: PropTypes.string,
}
