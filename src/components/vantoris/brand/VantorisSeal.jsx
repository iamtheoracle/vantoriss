import React, { useId } from 'react';
import VantorisMonogram from './VantorisMonogram';
import { VANTORIS_COLORS } from './VantorisMonogram';

/** Atchison Village Credit Union institutional seal; legacy export path retained. */
export default function VantorisSeal({ size = 160, theme = 'light', className = '' }) {
  const uid = useId().replace(/:/g, '');
  const gid = `avcu-seal-${uid}`;
  const ringColor = theme === 'dark' ? VANTORIS_COLORS.champagneGold : VANTORIS_COLORS.executiveBlue;
  const textColor = theme === 'dark' ? 'rgba(248,250,252,0.78)' : 'rgba(23,61,50,0.86)';

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Atchison Village Credit Union seal">
      <defs>
        <path id={`${gid}-top`} d="M100,100 m-78,0 a78,78 0 1,1 156,0" fill="none" />
        <path id={`${gid}-bottom`} d="M100,100 m78,0 a78,78 0 1,1 -156,0" fill="none" />
      </defs>
      <circle cx="100" cy="100" r="96" stroke={ringColor} strokeWidth="1" opacity=".5" />
      <circle cx="100" cy="100" r="89" stroke={ringColor} strokeWidth="2.5" />
      <circle cx="100" cy="100" r="80" stroke={ringColor} strokeWidth=".7" opacity=".65" />
      <text fill={textColor} style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '.22em', fontFamily: 'Inter, sans-serif' }}>
        <textPath href={`#${gid}-top`} startOffset="50%" textAnchor="middle">ATCHISON VILLAGE CREDIT UNION · </textPath>
      </text>
      <text fill={textColor} style={{ fontSize: '7px', fontWeight: 600, letterSpacing: '.2em', fontFamily: 'Inter, sans-serif' }}>
        <textPath href={`#${gid}-bottom`} startOffset="50%" textAnchor="middle">MEMBER OWNED · MEMBER FOCUSED · </textPath>
      </text>
      {[0, 90, 180, 270].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return <line key={deg} x1={100 + Math.cos(rad) * 70} y1={100 + Math.sin(rad) * 70} x2={100 + Math.cos(rad) * 75} y2={100 + Math.sin(rad) * 75} stroke={ringColor} strokeWidth="1.5" />;
      })}
      <g transform="translate(40,40)"><VantorisMonogram size={120} variant="metallic" theme={theme} /></g>
    </svg>
  );
}
