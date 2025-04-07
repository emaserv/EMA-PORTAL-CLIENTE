// LoadingModal.js
import React from 'react';
import Modal from 'react-modal';
import PropTypes from "prop-types";

Modal.setAppElement('#root'); // Ajusta el elemento raíz de tu aplicación

const spinnerStyles = {
  display: 'inline-block',
  width: '80px',
  height: '80px',
  margin: '8px',
  borderRadius: '50%',
  border: '6px solid #fff',
  borderColor: '#fff #nnn #fff #nnn',
  animation: 'spinner 1.2s linear infinite',
};

const keyframesStyles = `
  @keyframes spinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingModal = ({ isOpen }) => {
  return (
    <Modal
      isOpen={isOpen}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          border: 'none',
          background: '#nnn',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 999999999,
        },
      }}
    >
      <div style={spinnerStyles}></div>
      <style>{keyframesStyles}</style>
    </Modal>
  );
};


LoadingModal.propTypes = {
    isOpen : PropTypes.bool.isRequired

}
export default LoadingModal;
