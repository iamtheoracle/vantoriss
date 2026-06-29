// Centralized business contact configuration for Vantoris

// WhatsApp business number in international format (no +, no spaces) for wa.me links
export const BUSINESS_WHATSAPP_NUMBER = '18565550100';
export const BUSINESS_WHATSAPP_DISPLAY = '+1 (856) 555-0100';

export const SUPPORT_EMAIL = 'support@vantoris.com';
export const OPERATIONS_EMAIL = 'operations@vantoris.com';

export function whatsappLink(message = '') {
  const base = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}