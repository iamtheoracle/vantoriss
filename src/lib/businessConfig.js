// Institution contact details are intentionally unset until verified by the owner.
// Do not display placeholder phone numbers or invent a support email/domain.
export const BUSINESS_WHATSAPP_NUMBER = '';
export const BUSINESS_WHATSAPP_DISPLAY = '';
export const SUPPORT_EMAIL = '';
export const OPERATIONS_EMAIL = '';

export function whatsappLink(message = '') {
  if (!BUSINESS_WHATSAPP_NUMBER) return '';
  const base = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
