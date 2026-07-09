import React from 'react';

const ACCENTS = {
  brass:       { text: 'text-brass',       bg: 'bg-brass/10',       border: 'border-brass/20',       hex: '59,108,180' },
  mint:        { text: 'text-mint',        bg: 'bg-mint/10',        border: 'border-mint/20',        hex: '76,175,122' },
  crimson:     { text: 'text-crimson',     bg: 'bg-crimson/10',     border: 'border-crimson/20',     hex: '194,59,66' },
  blue:        { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    hex: '59,130,246' },
  gold:        { text: 'text-gold',        bg: 'bg-gold/10',        border: 'border-gold/20',        hex: '212,175,55' },
  champagne:   { text: 'text-champagne',   bg: 'bg-champagne/10',   border: 'border-champagne/20',   hex: '91,143,212' },
  emerald:     { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hex: '16,185,129' },
};

export default function PremiumStatCard({ label, value, sublabel, icon: Icon, accent = 'brass', alert, alertIcon: AlertIcon, onClick, hero, className = '' }) {
  const a = ACCENTS[accent] || ACCENTS.brass;
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`vantoris-glass p-5 text-left transition-all duration-300 ${
        onClick ? 'hover:shadow-float cursor-pointer hover:border-brass/20' : ''
      } ${hero ? 'lg:col-span-2' : ''} ${className}`}
      style={hero ? {
        background: `linear-gradient(135deg, rgba(${a.hex}, 0.1) 0%, rgba(27,45,69,0.4) 50%, rgba(10,26,46,0.2) 100%)`,
      } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center`}>
          {Icon && <Icon size={18} className={a.text} />}
        </div>
        {alert != null && alert !== '' && (
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.bg} ${a.text} border ${a.border}`}>
            {AlertIcon && <AlertIcon size={10} />}
            {typeof alert === 'number' ? alert : alert}
          </span>
        )}
      </div>
      <p className={`font-bold text-white tracking-tight ${hero ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'} leading-tight break-words`}>
        {value}
      </p>
      <p className="text-gray text-xs mt-1">{label}</p>
      {sublabel && <p className="text-gray/60 text-[10px] mt-0.5">{sublabel}</p>}
    </Tag>
  );
}