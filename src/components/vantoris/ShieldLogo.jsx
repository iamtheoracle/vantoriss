import React from 'react';

export default function ShieldLogo({ size = 40, className = '' }) {
  return (
    <img
      src="https://media.base44.com/images/public/6a3d85c1632966fefe16f3d4/90bb62306_image.png"
      alt="Vantoris"
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}