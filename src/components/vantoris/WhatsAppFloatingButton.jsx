import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';

export default function WhatsAppFloatingButton() {
  const whatsappNumber = useWhatsAppConfig();

  return (
    <a
      href={whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.')}
      target="_blank"
      rel="noopener noreferrer"
      title="Chat with support on WhatsApp"
      className="fixed bottom-6 left-4 z-40 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110"
    >
      <MessageCircle size={24} />
    </a>
  );
}