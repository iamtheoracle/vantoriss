import React from 'react';

export default function ShieldLogo({ size = 40, className = '' }) {
  return (
    <img
      src="https://media.base44.com/images/public/user_6a3d76162f38af1ca2dd83a3/4d0cae56b_D358AAC9-19C4-43B4-AE21-8E68DD7B773B.png"
      alt="Vantoris"
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}