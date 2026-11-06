import React, { useId } from 'react';
import { BRAND } from '@/lib/brand';

/**
 * Atchison Village Credit Union institutional mark.
 * The shield represents member protection; the paired AV letterforms represent
 * the institution and its members standing together.
 * The legacy component export name is retained to avoid breaking existing imports.
 */
export const VANTORIS_COLORS = {
  navy: BRAND.colors.deepForest,
  executiveBlue: BRAND.colors.forest,
  royalBlue: '#376B5A',
  champagneGold: BRAND.colors.gold,
  brushedGold: BRAND.colors.gold,
  white: '#FFFFFF',
  slateGray: '#66756E',
};

export default function VantorisMonogram({
  size = 48,
  variant = 'flat',
  theme = 'light',
  color,
  className = '',
}) {
  const uid = useId().replace(/:/g, '');
  const gold = variant === 'metallic' || variant === 'foil' ? BRAND.colors.gold : (color || (theme === 'dark' ? '#FFFFFF' : BRAND.colors.forest));
  const shield = theme === 'dark' ? '#FFFFFF' : BRAND.colors.forest;
  const fill = variant === 'outline' ? 'none' : shield;
  const stroke = variant === 'outline' ? gold : 'none';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-labelledby={`avcu-mark-title-${uid}`}
    >
      <title id={`avcu-mark-title-${uid}`}>Atchison Village Credit Union mark</title>
      <path d="M60 7 105 24v32c0 27-17 46-45 58C32 102 15 83 15 56V24L60 7Z" fill={fill} stroke={stroke} strokeWidth="3" />
      <path d="M60 14 98 28v28c0 22-13 38-38 49C35 94 22 78 22 56V28L60 14Z" stroke={gold} strokeWidth="1.8" opacity=".9" />
      <path d="m31 78 17-39h7l-17 39h-7Zm34 0L48 39h8l17 39h-8Z" fill={variant === 'monochrome' ? gold : BRAND.colors.gold} />
      <path d="M70 78 86 39h7L77 78h-7Z" fill={gold} opacity=".9" />
      <path d="M35 87h50" stroke={gold} strokeWidth="1.5" opacity=".7" />
    </svg>
  );
}
