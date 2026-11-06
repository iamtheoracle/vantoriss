import React, { useId } from 'react';
import VantorisMonogram from './VantorisMonogram';
import { BRAND } from '@/lib/brand';

/** Atchison Village Credit Union app icon; legacy import path retained. */
export default function VantorisAppIcon({ size = 120, rounded = true, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const radius = rounded ? 22 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Atchison Village Credit Union app icon">
      <defs>
        <linearGradient id={`av-bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BRAND.colors.forest} />
          <stop offset="1" stopColor={BRAND.colors.deepForest} />
        </linearGradient>
        <linearGradient id={`av-glass-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".16" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`av-clip-${uid}`}><rect width="120" height="120" rx={radius} /></clipPath>
      </defs>
      <g clipPath={`url(#av-clip-${uid})`}>
        <rect width="120" height="120" fill={`url(#av-bg-${uid})`} />
        <rect width="120" height="60" fill={`url(#av-glass-${uid})`} />
        <circle cx="60" cy="60" r="53" stroke={BRAND.colors.gold} strokeOpacity=".25" />
        <VantorisMonogram size={120} variant="metallic" theme="dark" />
      </g>
      <rect x=".5" y=".5" width="119" height="119" rx={radius} stroke="rgba(255,255,255,.12)" />
    </svg>
  );
}
