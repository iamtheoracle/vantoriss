import React from 'react';
import VantorisMonogram from './VantorisMonogram';
import { BRAND } from '@/lib/brand';

/**
 * Atchison Village Credit Union logo lockups.
 * The legacy component name remains as an internal compatibility alias.
 */
export default function VantorisLogo({
  layout = 'horizontal',
  size = 40,
  variant = 'flat',
  theme = 'light',
  color,
  className = '',
  showTagline = false,
}) {
  const isDark = theme === 'dark';
  const wordColor = color || (isDark ? '#F8FAFC' : BRAND.colors.forest);
  const taglineColor = isDark ? 'rgba(248,250,252,0.66)' : '#68766F';

  const Wordmark = () => (
    <span className="font-heading select-none" style={{
      fontSize: `${size * 0.31}px`,
      fontWeight: 800,
      letterSpacing: '0.075em',
      color: wordColor,
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      ATCHISON VILLAGE
    </span>
  );

  const Tagline = () => (
    <span className="font-body select-none" style={{
      fontSize: `${size * 0.19}px`,
      fontWeight: 700,
      letterSpacing: '0.22em',
      color: taglineColor,
      textTransform: 'uppercase',
      lineHeight: 1,
    }}>
      CREDIT UNION
    </span>
  );

  if (layout === 'standalone' || layout === 'stacked-mono') {
    return <VantorisMonogram size={size} variant={variant} theme={theme} color={color} className={className} />;
  }
  if (layout === 'watermark') {
    return <div className={className} style={{ opacity: isDark ? 0.08 : 0.06 }}>
      <VantorisMonogram size={size} variant={variant} theme={theme} color={color} />
    </div>;
  }
  if (layout === 'vertical') {
    return <div className={`flex flex-col items-center gap-3 ${className}`}>
      <VantorisMonogram size={size} variant={variant} theme={theme} color={color} />
      <div className="flex flex-col items-center gap-1.5">
        <Wordmark />
        <Tagline />
        {showTagline && <span className="text-[9px] uppercase tracking-[0.16em]" style={{ color: taglineColor }}>{BRAND.memberTagline}</span>}
      </div>
    </div>;
  }
  return <div className={`flex items-center gap-3 ${className}`}>
    <VantorisMonogram size={size} variant={variant} theme={theme} color={color} />
    <div className="flex flex-col gap-1">
      <Wordmark />
      <Tagline />
      {showTagline && <span className="text-[9px]" style={{ color: taglineColor }}>{BRAND.memberTagline}</span>}
    </div>
  </div>;
}
