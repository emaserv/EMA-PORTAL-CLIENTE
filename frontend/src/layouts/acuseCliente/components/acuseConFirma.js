import React, { useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import JsBarcode from "jsbarcode";
import MyMap from "./mapa";
import LogoEma from "assets/images/Portal-Cliente-Images/Logo-ema.png";
import LogoNaturgy from "assets/images/Portal-Cliente-Images/Naturgy.png";

const AcuseReciboConFirma = ({ data, onRendered }) => {
    const ref = useRef(null);
    const [mapReady, setMapReady] = React.useState(false);

  useEffect(() => {
    if (mapReady && ref.current && onRendered) {
      onRendered(ref.current);
    }
  }, [mapReady, onRendered]);

  const barcodeRef = useRef(null);

    useEffect(() => {
    if (barcodeRef.current && data.codigoBarras) {
        JsBarcode(barcodeRef.current, data.codigoBarras, {
        format: "CODE128",
        displayValue: false,
        height: 60,
        });
    }
    }, [data.codigoBarras]);

    const obtenerCoordenadas = (geo) => {
    const match = geo?.match(/maps\?q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (!match) return null;
    const [, lat, lon] = match;
    return [[parseFloat(lat), parseFloat(lon)]];
  };



  
  return (
    <Box p={2}>
      
      <Box
        ref={ref}
        sx={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "1000px",
          bgcolor: "#fff",
          p: 3,
          boxShadow: 3,
          borderRadius: 2,
          zIndex: -1, // aseguramos que esté al fondo
        }}
      >
        {/* Header */}
        <Grid container justifyContent="space-between" alignItems="center">
          <img src={LogoEma} alt="Logo" height={60} />
          <Box textAlign="center">
            <svg ref={barcodeRef} width={200} />
            <Typography variant="body2">{data.codigoBarras}</Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="body2" fontWeight="bold">
              EMA Servicios S.A.
            </Typography>
            <Typography variant="body2">R.N.P.S.P. 095</Typography>
            <Typography variant="body2">Av. San Martín 4970</Typography>
            <Typography variant="body2">Florida Oeste CP: 1602</Typography>
            <Typography variant="body2">CUIT: 30-69845547-7</Typography>
            <Typography variant="body2">www.emaservicios.com.ar</Typography>
          </Box>
        </Grid>

        <Box mt={2} p={1} bgcolor="#d0eaf4" textAlign="center">
          <Typography variant="h6">
            Acuse de recibo - Aviso de deuda - Clientes residenciales
          </Typography>
        </Box>

        {/* Datos de Entrega */}
        <Grid container spacing={2} mt={2} bgcolor="#f0f8fb" p={2}>
          <Grid item xs={12} sm={4}>
            <img src={LogoNaturgy} alt="Logo Naturgy" width={180} />

            <Typography variant="body2" fontWeight="bold">Importe: ${data.importe}</Typography>  
            <Typography variant="body2">Emisión: {data.fechaEmision}</Typography> 
            <Typography variant="body2">Fecha vencimiento: {data.vencimiento}</Typography> 
          </Grid>
          <Grid item xs={12} sm={4}>
          
            <Typography variant="body2" fontWeight="bold">
              Sr/a Usuario/a del servicio de gas:
            </Typography>
            <Typography variant="body2">N° Cliente: {data.nroCliente} </Typography> 
            <Typography variant="body2">N° Medidor:{data.medidor}</Typography> 
            <Typography variant="body2">{data.nombreCliente}</Typography> 
            <Typography variant="body2">Comprobante: {data.comprobante} </Typography> 
            
            
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight="bold">
              Domicilio:
            </Typography>
            <Typography variant="body2"> {data.direccion}</Typography>  
            <Typography variant="body2">
              Entre calle: {data.entreCalle}
            </Typography>
            <Typography variant="body2">CP: {data.codigoPostal}</Typography>
          </Grid>
        </Grid>

        {/* Visitas */}
        <Grid container spacing={3} mt={2}>
          {["1ª VISITA", "2ª VISITA"].map((label, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Typography variant="subtitle1" fontWeight="bold">
                {label}
              </Typography>
              <TextField label="Fecha" variant="outlined" size="small" fullWidth sx={{ mb: 1 }} defaultValue={i === 0 ? data.fecha : data.segundaVisita?.fecha2 || ""} />  
              <TextField label="Hora" variant="outlined" size="small" fullWidth sx={{ mb: 1 }} defaultValue={i === 0 ? data.hora : data.segundaVisita?.hora2 || ""} />
              <TextField 
                label="Distribuidor" 
                variant="outlined" 
                size="small" 
                fullWidth 
                sx={{ mb: 1 }} 
                value={
                  i === 1 && 
                  (!data.segundaVisita?.fecha2 || 
                  data.segundaVisita?.fecha2 === "-" || 
                  data.segundaVisita?.fecha2 === "") 
                  ? "-" 
                  : data.distribuidor
                }
              />
              {i === 1 && (
                <TextField label="Tipo de Entrega" variant="outlined" size="small" fullWidth sx={{ mb: 1 }} value={data.tipoEntrega} /> 
              )} 
            </Grid> 
          ))}
        </Grid>

        {/* Datos adicionales */}
        <Grid container spacing={3} mt={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="D.N.I./C.E./L.E." variant="outlined" size="small" fullWidth sx={{ mb: 1 }} value={data.dni} /> {/* aca el defaultValue tiene que ser "dni" */} 
            <TextField label="Aclaración" variant="outlined" size="small" fullWidth sx={{ mb: 1 }} value={data.aclaracion} /> {/* aca el defaultValue tiene que ser "aclaracion" */} 
            <TextField label="Vínculo" variant="outlined" size="small" fullWidth sx={{ mb: 1 }} value={data.vinculo} /> {/* aca el defaultValue tiene que ser "vinculo" */} 
            <Typography variant="body2" fontWeight="bold" mt={1}>
              Descripción NO Entrega:
            </Typography>
            {["Se mudó", "Rehusado", "Otros"].map((text, i) => (
              <FormControlLabel
                key={i}
                control={<Checkbox size="small" />}
                label={text}
              />
            ))}
          </Grid>          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="bold">
              Referencias:
            </Typography>
            <Box
              sx={{
                border: "1px solid #ccc",
                borderRadius: 1,
                backgroundColor: "#f8f8f8",
                p: 1,
                mb: 2,
              }}
            >
              <Typography variant="body2">1° REFERENCIA: {data.referencia1} </Typography>
              <Typography variant="body2">2° REFERENCIA: {data.referencia2}</Typography>
              <Typography variant="body2">3° REFERENCIA: {data.referencia3}</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Imágenes */}
        <Grid container spacing={2} mt={3}>
           <Grid item xs={12} sm={6}>
            {data.foto && (
              <img
                src={`data:image/jpeg;base64,${data.foto}`}
                alt="Foto"
                width="100%"
                style={{ borderRadius: 5, border: "1px solid #ccc" }}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            {data.firma && (
              <img
                src={`data:image/png;base64,${data.firma}`}
                alt="Firma"
                width="100%"
                style={{ borderRadius: 5, border: "1px solid #ccc", marginBottom: "10px" }}
              />
            )}
            {data.geo && obtenerCoordenadas(data.geo) && (
              <Box
                sx={{
                  height: 300,
                  width: "100%",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                {(() => {
                  const [lat, lon] = obtenerCoordenadas(data.geo)[0];
                  return (
                    <img
                      src={`https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=800&height=400&center=lonlat:${lon},${lat}&zoom=15&marker=lonlat:${lon},${lat};type:material;color:%23ff0000;size:large&apiKey=44f7d58265c54b939df7520a9133e625`}
                      alt="Mapa estático"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onLoad={() => setMapReady(true)}
                    />
                  );
                })()}
              </Box>
            )}


            <TextField
  variant="outlined"
  size="small"
  fullWidth
  defaultValue={
    obtenerCoordenadas(data.geo)
      ? `${obtenerCoordenadas(data.geo)[0][0]}, ${obtenerCoordenadas(data.geo)[0][1]}`
      : ""
  }
/>

          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AcuseReciboConFirma;