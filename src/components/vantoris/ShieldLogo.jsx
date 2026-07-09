import React from 'react';
import VantorisMonogram from '@/components/vantoris/brand/VantorisMonogram';

export default function ShieldLogo({ size = 40, className = '', variant = 'metallic', theme }) {
  // Auto-detect: dark backgrounds get the gold/dark treatment by default for premium feel
  const resolvedTheme = theme || 'light';
  return (
    <VantorisMonogram
      size={size}
      variant={variant}
      theme={resolvedTheme}
      className={className}
    />
  );
}