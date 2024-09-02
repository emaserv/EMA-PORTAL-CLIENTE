import React, { useCallback } from 'react';
import Typography from '@mui/material/Typography';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';

import PropTypes from 'prop-types';

const DropFileInput = (props) => {

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
        paddingLeft: '15rem',
        paddingRight: '15rem',
        paddingTop: '3rem',
        paddingBottom: '3rem',
        borderRadius: 2,
        cursor: 'pointer',
        border: '1px dashed #aaa', 
        width: '100%',
        background: 'linear-gradient(310deg, #2152ff, #21d4fd)',
      }}
      
    >
      {props.fileName != "init" ? (
        <>
          <Typography variant="h6" sx={{color: '#FFFFFF'}}>Archivo seleccionado:</Typography>
          <Typography variant="subtitle2" sx={{color: '#FFFFFF'}}><i>{props.fileName}</i></Typography>
        </>
      ) : (
        <>
          <input
            type="file"
            id="fileInput"
            style={{ display: 'none' }}
            onChange = {(e) => handleFile(e.target.files[0])}
          />
          <IconButton>
            <CloudUploadIcon sx={{ fontSize: 40, color: '#ffffff' }} />
          </IconButton>
          <Typography variant="button" component="span" sx={{color:'#ffffff'}}>
            Arrastre o seleccione un archivo
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