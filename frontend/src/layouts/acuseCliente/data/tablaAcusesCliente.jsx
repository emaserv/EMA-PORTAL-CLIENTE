import { React, useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import MapIcon from "@mui/icons-material/Map";
import PhotoIcon from "@mui/icons-material/Photo";
import EditIcon from "@mui/icons-material/Edit";
import ArticleIcon from "@mui/icons-material/Article";
import PopUp from "../components/PopUp";
import MyMap from "../components/mapa";
import ReactDOMServer from 'react-dom/server';
import AcuseReciboConFirma from "../components/acuseConFirma";
import ReactDOM from "react-dom/client";
import html2canvas from "html2canvas";

const formatearFecha = (date) => {
  if (!date) return "-";
  const partes = date.split(/[-/]/); // acepta "-" o "/"
  if (partes.length !== 3) return date;
  return `${partes[2]}/${partes[1]}/${partes[0]}`; // DD/MM/YYYY
};

const formatearHora = (hora) => {
  if (!hora) return "-";
  return hora.slice(0, 5); // Ej: "15:55:58" → "15:55"
};





const headCells = [
  { id: "fechaEmision", label: "F. EMISION", labelComplete: "Fecha de Emisión" },
  { id: "vencimiento", label: "F. VENCIMIENTO", labelComplete: "Fecha de Vencimiento" },
  { id: "nroCliente", label: "NRO CLIENTE", labelComplete: "Número de Cliente" },
  { id: "medidor", label: "MEDIDOR", labelComplete: "Número de Medidor" },
  { id: "nombreCliente", label: "TITULAR", labelComplete: "Titular" },
  { id: "direccion", label: "DIRECCION", labelComplete: "Dirección" },
  { id: "codigoPostal", label: "CP - LOCALIDAD", labelComplete: "Código Postal y Localidad" },
  { id: "fecha", label: "F. 1º V", labelComplete: "Fecha 1º Visita" },
  { id: "hora", label: "Hr 1", labelComplete: "Hora 1º Visita" },
  { id: "fecha2", label: "F. 2º V", labelComplete: "Fecha 2º Visita" },
  { id: "hora2", label: "Hr 2", labelComplete: "Hora 2º Visita" },
  { id: "importe", label: "IMPORTE", labelComplete: "Importe" },
  { id: "tipoEntrega", label: "ENTREGA", labelComplete: "Tipo de Entrega" },
  { id: "referencias", label: "REFERENCIAS", labelComplete: "Referencias" },
  { id: "geo", label: "V.", labelComplete: "Ubicación" },
  { id: "foto", label: "FOTO", labelComplete: "Foto" },
  { id: "firma", label: "FIRMA", labelComplete: "Firma" },
  { id: "acuse", label: "ACUSE", labelComplete: "Acuse" },
];

const TablaAcusesCliente = ({ data }) => {

  const [popupAbierto, setPopupAbierto] = useState(false);
  const [coordenadaMapa, setCoordenadaMapa] = useState([]);
  const [popupFotoAbierto, setPopupFotoAbierto] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [popupFirmaAbierta, setPopupFirmaAbierta] = useState(false);
  const [firmaSeleccionada, setFirmaSeleccionada] = useState(null);

  const abrirAcuseEnNuevaPestaniaConCanvas = (item) => {
    const contenedor = document.createElement("div");
    contenedor.style.position = "fixed";
    contenedor.style.top = "-9999px";
    contenedor.style.left = "0";
    contenedor.style.width = "1000px";
    contenedor.style.zIndex = "-1";
    contenedor.style.backgroundColor = "#fff";
    document.body.appendChild(contenedor);

    const root = ReactDOM.createRoot(contenedor);

    root.render(
      <AcuseReciboConFirma
        data={item}
        onRendered={async (refElement) => {
          const canvas = await html2canvas(refElement, {
            useCORS: true,
            backgroundColor: "#fff",
            scrollY: 0,
            scale: 1.2,
          });

          // Usamos calidad 0.5 para que pese como los masivos
          canvas.toBlob((blob) => {
            const urlDescarga = URL.createObjectURL(blob);
            const reader = new FileReader();

            reader.onloadend = () => {
              const dataUrl = reader.result;

              const nuevaVentana = window.open();
              if (nuevaVentana) {
                nuevaVentana.document.write(`
  <html>
    <head>
      <title>Acuse de Recibo</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          background-color: white;
        }

        .boton-descargar {
          margin: 20px auto 10px auto;
          padding: 8px 16px;
          background-color: #2152ff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .soft-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(to top, #2152ff, #21d4fd);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 0.8rem;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 4px 8px rgba(33, 82, 255, 0.3);
          transition: all 0.3s ease;
        }

        .soft-button:hover {
          box-shadow: 0 6px 12px rgba(33, 82, 255, 0.4);
          transform: translateY(-1px);
        }

        .icon {
          width: 18px;
          height: 18px;
          fill: white;
        }


        .contenido-img {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          box-shadow: 0 0 8px rgba(0,0,0,0.1);
        }

        .icon {
          width: 18px;
          height: 18px;
          fill: white;
        }
      </style>
    </head>
    <body>
      <a href="${urlDescarga}" download="_${item.codigoBarras}.jpg" class="soft-button">
        <svg class="icon" viewBox="0 0 24 24">
          <path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.34v4h4.66v-4h3.34L12 2z"/>
        </svg>
        Descargar JPG
      </a>

      <div class="contenido-img">
        <img src="${dataUrl}" alt="acuse" />
      </div>
    </body>
  </html>
`);


                nuevaVentana.document.close();
              }
            };

            reader.readAsDataURL(blob);
          }, "image/jpeg", 0.5); // 👈 compresión al 50% como en los ZIP

          root.unmount();
          document.body.removeChild(contenedor);
        }}
      />
    );
  };

  const obtenerLatLon = (url) => {
    const regex = /maps\?q=([-0-9.]+),([-0-9.]+)/;
    const match = url.match(regex);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return null;
  };

  

  return (
    <SoftBox mt={4} width="100%">
      
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: "500px",
          overflowY: "auto",
          overflowX: "hidden",
          width: "100%",
          boxShadow: 3,
        }}
      >
        <Table sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <Tooltip key={headCell.id} title={headCell.labelComplete || ""}>
                  <TableCell
                    sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "linear-gradient(to top, #2152ff, #21d4fd)",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.85rem",
            textTransform: "uppercase",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            padding: "8px 12px",
            borderBottom: "1px solid #e0e0e0",
            width: ["geo", "foto", "firma", "acuse", "hora", "hora2"].includes(headCell.id) ? "60px" : undefined,
          }}
                  >
                    {headCell.label}
                  </TableCell>
                </Tooltip>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
           {data.map((item, index) => {
              // console.log(`Fila ${index + 1}`, {
              //   fecha: item.fecha,
              //   hora: item.hora,
              //   fecha2: item.segundaVisita?.fecha2,
              //   hora2: item.segundaVisita?.hora2,
              // });
              return (          
                <TableRow key={index}>
                  <Tooltip title={formatearFecha(item.fechaEmision)}><TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap",  }}>{formatearFecha(item.fechaEmision)}</TableCell></Tooltip>
                  <Tooltip title={formatearFecha(item.vencimiento)}><TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap", }}>{formatearFecha(item.vencimiento)}</TableCell></Tooltip>
                  <Tooltip title={item.nroCliente}>
                      <TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "wrap", }}>
                          {item.nroCliente}
                      </TableCell>    
                  </Tooltip>
                  <Tooltip title={item.medidor}><TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap", }}>{item.medidor}</TableCell></Tooltip>
                  <Tooltip title={item.nombreCliente}>
                      <TableCell
                          sx={{
                          textAlign: "center",
                          fontSize: "0.85rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100px",
                          }}
                      >
                          {item.nombreCliente?.slice(0, 8)}
                      </TableCell>
                  </Tooltip>

                  <Tooltip title={item.direccion}>
                      <TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap", }}>
                          {item.direccion?.slice(0, 8)}
                      </TableCell>
                  </Tooltip>
                  <Tooltip title={item.codigoPostal}>
                      <TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap", }}>
                          {item.codigoPostal?.slice(0, 8)}
                      </TableCell>
                  </Tooltip>
                  <Tooltip title={formatearFecha(item.fecha)}><TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap", }}>{formatearFecha(item.fecha)}</TableCell></Tooltip>
                  <Tooltip title={formatearHora(item.hora)}><TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap", }}>{formatearHora(item.hora)}</TableCell></Tooltip>
                  
                  <Tooltip title={formatearFecha(item.segundaVisita?.fecha2) || "-"}>
                    <TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                      {formatearFecha(item.segundaVisita?.fecha2) || "-"}
                    </TableCell>
                  </Tooltip>
                  <Tooltip title={formatearHora(item.segundaVisita?.hora2) || "-"}>
                    <TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                      {formatearHora(item.segundaVisita?.hora2) || "-"}
                    </TableCell>
                  </Tooltip>
                  <Tooltip title={item.importe}><TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap", }}>${item.importe}</TableCell></Tooltip>
                  <Tooltip title={item.tipoEntrega}><TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap", }}>{item.tipoEntrega}</TableCell></Tooltip>
                  <Tooltip
                      title={
                          <>
                          {item.referencia1 && <div>Referencia 1: {item.referencia1}</div>}
                          {item.referencia2 && <div>Referencia 2: {item.referencia2}</div>}
                          {item.referencia3 && <div>Referencia 3: {item.referencia3}</div>}
                          </>
                      }
                      arrow
                      >
                      <TableCell sx={{ textAlign: "center", fontSize: "0.85rem", whiteSpace: "nowrap", }}>
                          {[item.referencia1, item.referencia2, item.referencia3]
                          .filter(Boolean)
                          .join(" | ")
                          .slice(0, 8)}
                      </TableCell>
                      </Tooltip>
                  <TableCell sx={{ textAlign: "center", width: "40px" }}>
                    {item.geo ? (
                      <button
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                        onClick={() => {
                          const coord = obtenerLatLon(item.geo);
                          if (coord) {
                            setCoordenadaMapa([coord]);
                            setPopupAbierto(true);
                          }
                        }}
                      >
                        <MapIcon sx={{ color: "#2152ff" }} />
                      </button>
                    ) : (
                      <MapIcon sx={{ color: "#ccc" }} />
                    )}
                  </TableCell>

                  <TableCell sx={{ textAlign: "center", width: "60px" }}>
                    {item.foto ? (
                      <button
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                        onClick={() => {
                          setFotoSeleccionada(item.foto);
                          setPopupFotoAbierto(true);
                        }}
                      >
                        <PhotoIcon sx={{ color: "#2152ff" }} />
                      </button>
                    ) : (
                      <PhotoIcon sx={{ color: "#ccc" }} />
                    )}
                  </TableCell>

                  <TableCell sx={{ textAlign: "center", width: "60px" }}>
                    {item.firma ? (
                      <button
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                        onClick={() => {
                          setFirmaSeleccionada(item.firma);
                          setPopupFirmaAbierta(true);
                        }}
                      >
                        <EditIcon sx={{ color: "#2152ff" }} />
                      </button>
                    ) : (
                      <EditIcon sx={{ color: "#ccc" }} />
                    )}
                  </TableCell>
                  
                  <TableCell sx={{ textAlign: "center", width: "60px" }}>
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer" }}
                      onClick={() => abrirAcuseEnNuevaPestaniaConCanvas(item)}
                    >
                      <ArticleIcon sx={{ color: "#2152ff" }} />
                    </button>
                  </TableCell>

                
                </TableRow> 
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <PopUp
        estado={popupAbierto}
        cambiarEstado={setPopupAbierto}
        titulo="Ubicación en Mapa"
        background="#2152ff"
      >
        <div style={{ flexGrow: 1, height: '100%' }}>
          <MyMap
            arrayPuntos={coordenadaMapa}
            arrayCamino={[]}
            geoJsonData={[]}
            geoJsonData2={null}
          />
        </div>
      </PopUp>

      <PopUp
        estado={popupFotoAbierto}
        cambiarEstado={setPopupFotoAbierto}
        titulo="Foto del Cliente"
        background="#2152ff"
        customSize="popup-imagen"
      >
        <img
          src={`data:image/jpeg;base64,${fotoSeleccionada}`}
          alt="Foto cliente"
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
        />
      </PopUp>

      <PopUp
        estado={popupFirmaAbierta}
        cambiarEstado={setPopupFirmaAbierta}
        titulo="Firma del Cliente"
        background="#2152ff"
        customSize="popup-imagen"
      >
        <img
          src={`data:image/jpeg;base64,${firmaSeleccionada}`}
          alt="Firma cliente"
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
        />
      </PopUp>
    </SoftBox>    
  );
};

TablaAcusesCliente.propTypes = {
  data: PropTypes.array.isRequired,
};

export default TablaAcusesCliente;