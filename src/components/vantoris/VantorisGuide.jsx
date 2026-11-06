import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageCircle, Mail, HelpCircle } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import { BUSINESS_WHATSAPP_DISPLAY, SUPPORT_EMAIL } from '@/lib/businessConfig';

export default function VantorisGuide() {
  const whatsappNumber = useWhatsAppConfig();
  const navigate = useNavigate();

  const guides = [
    {
      icon: Sparkles,
      label: 'AVA Assistant',
      desc: 'Your personal credit-union guide',
      color: 'text-brass',
      bg: 'bg-brass/12',
      onClick: () => navigate('/ava'),
    },
    {
      icon: MessageCircle,
      label: 'Secure Messages',
      desc: 'Contact member support in the app',
      color: 'text-mint',
      bg: 'bg-mint/12',
      onClick: () => navigate('/messages'),
    },
    ...(whatsappNumber ? [{
      icon: MessageCircle,
      label: 'WhatsApp Support',
      desc: `Chat · ${BUSINESS_WHATSAPP_DISPLAY || whatsappNumber}`,
      color: 'text-mint',
      bg: 'bg-mint/12',
      href: whatsappLinkFromConfig(whatsappNumber, 'Hello Atchison Village Credit Union Support, I need guidance.'),
    }] : []),
    ...(SUPPORT_EMAIL ? [{
      icon: Mail,
      label: 'Email Support',
      desc: SUPPORT_EMAIL,
      color: 'text-champagne',
      bg: 'bg-champagne/12',
      href: `mailto:${SUPPORT_EMAIL}`,
    }] : []),
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle size={16} className="text-brass" />
        <h3 className="text-foreground font-semibold text-sm">Member support</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {guides.map((guide, index) => {
          const Icon = guide.icon;
          const content = (
            <>
              <div className={`w-10 h-10 rounded-xl ${guide.bg} flex items-center justify-center mb-2`}>
                <Icon size={20} className={guide.color} />
              </div>
              <p className="text-foreground font-medium text-sm">{guide.label}</p>
              <p className="text-gray text-xs">{guide.desc}</p>
            </>
          );
          if (guide.href) {
            return <a key={index} href={guide.href} target="_blank" rel="noopener noreferrer" className="vantoris-glass-flat p-4 text-left hover:border-brass/25 transition-all">{content}</a>;
          }
          return <button key={index} onClick={guide.onClick} className="vantoris-glass-flat p-4 text-left hover:border-brass/25 transition-all">{content}</button>;
        })}
      </div>
    </div>
  );
}
