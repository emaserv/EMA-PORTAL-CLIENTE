import React from 'react';
import { useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const PopUp = ({ children, estado, cambiarEstado, titulo, background, customSize }) => {
  useEffect(() => {
    if (estado) {
      // Deshabilitar el scroll
      document.body.style.overflow = "hidden";
    } else {
      // Restaurar el scroll
      document.body.style.overflow = "auto";
    }

    // Restaurar al desmontar
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [estado]);
  return (
    <>
      {estado && (
        <Overlay>
          <ContenedorModal className={customSize ? customSize : ""}>
            <EncabezadoModal background={background}>
              <Titulo>{titulo}</Titulo>
              <BotonCerrar onClick={() => cambiarEstado(false)}>X</BotonCerrar>
            </EncabezadoModal>
            {children}
          </ContenedorModal>
        </Overlay>
      )}
    </>
  );
};

export default PopUp;

const Overlay = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5); /* Fondo oscuro */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
`;

const ContenedorModal = styled.div`
  background: #fff;
  border-radius: 10px;
  width: 90vw;
  max-width: 1800px;
  height: 70vh;
  max-height: 900px;
  padding: 0px;
  overflow-y: auto;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 5px 15px;
  position: relative;
  display: flex;
  flex-direction: column;

  &.popup-imagen {
    width: auto;
    height: auto;
    max-width: none;
    max-height: none;
    overflow: visible;
    display: inline-block;
  }
`;



const EncabezadoModal = styled.div`
  position: sticky; /* 👈 hace que el encabezado quede visible al hacer scroll */
  top: 0;
  z-index: 100; /* 👈 asegura que esté sobre el mapa */
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${(props) => props.background || '#f5f5f5'};
  padding: 10px 20px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
`;

const Titulo = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #FFFFFF;
  h3 {
		font-weight: 500;
		font-size: 16px;
		color: ${props => props.background ? '#FFFFFF' : '#000000'};
		padding-left: 10px;
		padding-top: 5px;
	}
`;

const BotonCerrar = styled.button`
  width: 25px;
  height: 25px;
  border: none;
  background: #f2f2f2;
  color: #808080;
  font-size: 16px;
  cursor: pointer;
  border-radius: 50%;
  z-index: 9999;
  position: relative;

  &:hover {
    background: #e0e0e0;
  }
`;

PopUp.propTypes = {
  children: PropTypes.node,
  estado: PropTypes.bool.isRequired,
  cambiarEstado: PropTypes.func.isRequired,
  titulo: PropTypes.string.isRequired,
  background: PropTypes.string,
};
