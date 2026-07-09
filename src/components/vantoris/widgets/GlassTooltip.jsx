import React from 'react';
import { formatCurrency } from '@/lib/formatCurrency';

const THEME = {
  navy: '#0B0F18',
  slate: '#242D38',
  gray: '#AAB4C3',
  brass: '#B08D57',
  mint: '#7EB89F',
  crimson: '#8C2F39',
  champagne: '#D4B996',
};

export default function GlassTooltip({ active, payload, label, currency }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{
      backgroundColor: 'rgba(11,15,24,0.95)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(176,141,87,0.15)',
      borderRadius: '12px',
      padding: '10px 14px',
      boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: THEME.gray, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < payload.length - 1 ? '4px' : 0 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: entry.color || entry.fill }} />
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
            {currency ? formatCurrency(entry.value) : entry.value.toLocaleString()}
          </span>
          <span style={{ color: THEME.gray, fontSize: '11px' }}>{entry.name}</span>
        </div>
      ))}
    </div>
  );
}