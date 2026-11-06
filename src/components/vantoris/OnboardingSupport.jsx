import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageCircle, Mail, LifeBuoy } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import { BUSINESS_WHATSAPP_DISPLAY, SUPPORT_EMAIL } from '@/lib/businessConfig';

export default function OnboardingSupport() {
  const navigate = useNavigate();
  const whatsappNumber = useWhatsAppConfig();

  const channels = [
    { icon: Sparkles, title: 'Ask AVA', subtitle: 'Your personal credit-union guide', onClick: () => navigate('/ava') },
    { icon: MessageCircle, title: 'Secure Messages', subtitle: 'Contact member support in the app', onClick: () => navigate('/messages') },
    ...(whatsappNumber ? [{
      icon: MessageCircle,
      title: 'WhatsApp',
      subtitle: BUSINESS_WHATSAPP_DISPLAY || whatsappNumber,
      href: whatsappLinkFromConfig(whatsappNumber, 'Hello Atchison Village Credit Union, I need support.'),
    }] : []),
    ...(SUPPORT_EMAIL ? [{ icon: Mail, title: 'Email Support', subtitle: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` }] : []),
  ];

  return (
    <div className="rounded-2xl bg-white border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <LifeBuoy size={18} className="text-[#C5A66A]" />
        <h3 className="font-semibold text-foreground">We're here to help</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {channels.map((channel, index) => {
          const Icon = channel.icon;
          const className = "flex flex-col items-start gap-2 rounded-xl border border-border bg-[#FBF9F3] p-4 text-left hover:border-[#C5A66A] transition-colors";
          const content = (
            <>
              <Icon size={19} className="text-[#173D32]" />
              <span className="font-semibold text-sm text-foreground">{channel.title}</span>
              <span className="text-[11px] leading-relaxed text-gray">{channel.subtitle}</span>
            </>
          );
          if (channel.href) return <a key={index} href={channel.href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>;
          return <button key={index} onClick={channel.onClick} className={className}>{content}</button>;
        })}
      </div>
    </div>
  );
}
