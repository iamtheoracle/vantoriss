import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Mail, Sparkles } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import { SUPPORT_EMAIL, BUSINESS_WHATSAPP_DISPLAY } from '@/lib/businessConfig';

export default function OnboardingSupport() {
  const whatsappNumber = useWhatsAppConfig();
  const navigate = useNavigate();

  return (
    <div className="mt-5">
      <p className="text-white font-semibold text-sm mb-3">Need help? We're here for you</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/advisor')}
          className="vantoris-card p-4 text-left hover:border-brass/30 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center mb-2">
            <Sparkles size={18} className="text-purple-400" />
          </div>
          <p className="text-white font-medium text-sm">Vantoris Guide</p>
          <p className="text-[#AAB4C3] text-xs">AI onboarding assistant</p>
        </button>
        <a
          href={whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris, I need help with my onboarding.')}
          target="_blank"
          rel="noopener noreferrer"
          className="vantoris-card p-4 text-left hover:border-emerald-500/30 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-2">
            <MessageCircle size={18} className="text-emerald-400" />
          </div>
          <p className="text-white font-medium text-sm">WhatsApp</p>
          <p className="text-[#AAB4C3] text-xs">Chat with support</p>
        </a>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="vantoris-card p-4 text-left hover:border-blue-500/30 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center mb-2">
            <Mail size={18} className="text-blue-400" />
          </div>
          <p className="text-white font-medium text-sm">Email</p>
          <p className="text-[#AAB4C3] text-xs">{SUPPORT_EMAIL}</p>
        </a>
        <a
          href={`tel:${BUSINESS_WHATSAPP_DISPLAY.replace(/[^0-9+]/g, '')}`}
          className="vantoris-card p-4 text-left hover:border-brass/30 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-brass/15 flex items-center justify-center mb-2">
            <MessageCircle size={18} className="text-brass" />
          </div>
          <p className="text-white font-medium text-sm">Call Us</p>
          <p className="text-[#AAB4C3] text-xs">{BUSINESS_WHATSAPP_DISPLAY}</p>
        </a>
      </div>
    </div>
  );
}