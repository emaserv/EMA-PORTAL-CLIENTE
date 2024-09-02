import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const PopUp = ({
	children,
	estado,
	cambiarEstado,
	titulo,
	mostrarHeader,
	mostrarOverlay,
	posicionModal,
	padding,
	background,
	height,
	width,
}) => {
	return (
		<>
			{estado && 
				<Overlay mostrarOverlay={mostrarOverlay} posicionModal={posicionModal}>
					<ContenedorModal padding={padding} width={width} height={height}>
						{mostrarHeader && 
							<EncabezadoModal background={background}>
								<h3>{titulo}</h3>
							</EncabezadoModal>
						}

						<BotonCerrar onClick={() => cambiarEstado(false)}>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
								<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
							</svg>
						</BotonCerrar>

						{ children }
					</ContenedorModal>
				</Overlay>
			}
		</>
	);
}
 
export default PopUp;

//El z-index es para que aparezca por sobre todos los items
const Overlay = styled.div`
	width: 100vw;
	height: 100vh;
	position: fixed;
	top: 0;
	left: 0;
	background: ${props => props.mostrarOverlay ? 'rgba(0,0,0,.5)' : 'rgba(0,0,0,0)'};
	padding: 40px;
	display: flex;
	align-items: ${props => props.posicionModal ? props.posicionModal : 'center'};
	justify-content: center;
	z-index: 1200;
`;

const ContenedorModal = styled.div`
	background: #fff;
	position: relative;
	border-radius: 15px;
	box-shadow: rgba(100,100,111, 0.2) 0px 7px 29px 0px;
	width: ${props => props.width ? props.width : '50vw'};
	height: ${props => props.height ? props.height : '40vh'};
	min-height: 300px;
	padding: ${props => props.padding ? props.padding : '5%'};
`;

const EncabezadoModal = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 5px;
	padding-bottom: 5px;
	border-bottom: 1px solid #E8E8E8;
	background: ${props => props.background ? props.background : '#FFFFFF'};
	border-top-left-radius: 15px;
  	border-top-right-radius: 15px;

	h3 {
		font-weight: 500;
		font-size: 16px;
		color: ${props => props.background ? '#FFFFFF' : '#000000'};
		padding-left: 10px;
		padding-top: 5px;
	}
`;

const BotonCerrar = styled.button`
	position: absolute;
	top: -15px;
	right: -15px;

	width: 30px;
	height: 30px;
	border: none;
	background: #d9d9d9;
	cursor: pointer;
	transition: .3s ease all;
	border-radius: 20px; 
	color: #808080;

	&:hover {
		background: #f2f2f2;
	}

	svg {
		width: 100%;
		height: 100%;
	}
`;

PopUp.propTypes = {
    children: PropTypes.object,
    estado: PropTypes.bool.isRequired,
    cambiarEstado: PropTypes.func.isRequired,
    titulo: PropTypes.string,
    mostrarHeader: PropTypes.bool,
    mostrarOverlay: PropTypes.bool.isRequired,
    posicionModal: PropTypes.string.isRequired,
    padding: PropTypes.string,
	background: PropTypes.string.isRequired,
	width: PropTypes.string,
	height: PropTypes.string,
	datapop: PropTypes.object
}






