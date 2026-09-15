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
  borderColor: '#fff transparent #fff transparent',
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

const progressCardStyles = {
  minWidth: '260px',
  padding: '24px 28px',
  borderRadius: '12px',
  backgroundColor: '#fff',
};

const progressPercentStyles = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#344767',
  marginBottom: '10px',
};

const progressBarOuterStyles = {
  width: '100%',
  height: '10px',
  borderRadius: '999px',
  backgroundColor: '#e9ecf5',
  overflow: 'hidden',
};

const progressBarInnerStyles = {
  height: '100%',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, #2152ff, #21d4fd)',
  transition: 'width 0.3s ease',
};

const progressMessageStyles = {
  marginTop: '14px',
  fontSize: '0.9rem',
  color: '#67748e',
  fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
};

const LoadingModal = ({ isOpen, progress, message }) => {
  const showProgress = typeof progress === 'number' && !Number.isNaN(progress);
  const progressClamped = showProgress ? Math.min(100, Math.max(0, progress)) : 0;

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
          background: showProgress ? '#fff' : 'transparent',
          padding: showProgress ? 0 : undefined,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 999999999,
        },
      }}
    >
      {showProgress ? (
        <div style={progressCardStyles}>
          <div style={progressPercentStyles}>{Math.round(progressClamped)}%</div>
          <div style={progressBarOuterStyles}>
            <div style={{ ...progressBarInnerStyles, width: `${progressClamped}%` }} />
          </div>
          {message && <div style={progressMessageStyles}>{message}</div>}
        </div>
      ) : (
        <>
          <div style={spinnerStyles}></div>
          <style>{keyframesStyles}</style>
        </>
      )}
    </Modal>
  );
};


LoadingModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    progress: PropTypes.number,
    message: PropTypes.string,
}
export default LoadingModal;
