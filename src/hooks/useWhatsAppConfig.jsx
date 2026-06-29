import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BUSINESS_WHATSAPP_NUMBER } from '@/lib/businessConfig';

export function useWhatsAppConfig() {
  const [number, setNumber] = useState(BUSINESS_WHATSAPP_NUMBER);

  useEffect(() => {
    async function load() {
      try {
        const configs = await base44.entities.AppConfiguration.filter({ key: 'whatsapp_number' });
        if (configs.length > 0 && configs[0].value) setNumber(configs[0].value);
      } catch (e) { /* fall back to default */ }
    }
    load();
  }, []);

  return number;
}

export function whatsappLinkFromConfig(number, message = '') {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}