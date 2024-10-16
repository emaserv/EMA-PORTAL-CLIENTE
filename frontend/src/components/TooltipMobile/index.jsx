import React, { useState } from 'react';
import Tooltip from '@mui/material/Tooltip';

const MobileFriendlyTooltip = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  const handleTouchStart = () => {
    setOpen(true);
  };

  const handleTouchEnd = () => {
    setOpen(false);
  };

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Tooltip title={title} open={open} disableHoverListener>
        {children}
      </Tooltip>
    </div>
  );
};

export default MobileFriendlyTooltip;