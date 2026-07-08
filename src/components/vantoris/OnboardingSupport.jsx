import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageCircle, Sparkles } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import { BUSINESS_WHATSAPP_DISPLAY, SUPPORT_EMAIL } from '@/lib/businessConfig';

function SupportCard({ icon: Icon, title, detail, tone = 'blue', ...props }) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#E7F8F1] text-[#12805C] group-hover:bg-[#12805C]'
      : tone === 'red'
        ? 'bg-[#FCE7EA] text-[#E31837] group-hover:bg-[#E31837]'
        : 'bg-[#E7EEF9] text-[#012169] group-hover:bg-[#012169]';

  const Component = props.href ? 'a' : 'button';

  return (
    <Component
      {...props}
      className="group rounded-lg border border-[#D8DEE8] bg-white p-4 text-left shadow-sm transition hover:border-[#012169] hover:bg-[#F8FAFC]"
    >
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg transition group-hover:text-white ${toneClass}`}>
        <Icon size={18} />
      </div>
      <p className="text-sm font-bold text-[#071A33]">{title}</p>
      <p className="mt-1 break-words text-xs text-[#5B6472]">{detail}</p>
    </Component>
  );
}

export default function OnboardingSupport() {
  const whatsappNumber = useWhatsAppConfig();
  const navigate = useNavigate();

  return (
    <section className="mt-5">
      <div className="mb-3">
        <p className="text-sm font-bold text-[#071A33]">Need help? We are here for you</p>
        <p className="mt-1 text-xs text-[#5B6472]">Get onboarding support from BOA through your preferred channel.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SupportCard
          type="button"
          icon={Sparkles}
          title="BOA Guide"
          detail="AI onboarding assistant"
          tone="red"
          onClick={() => navigate('/advisor')}
        />
        <SupportCard
          icon={MessageCircle}
          title="WhatsApp"
          detail="Chat with support"
          tone="green"
          href={whatsappLinkFromConfig(whatsappNumber, 'Hello BOA, I need help with my onboarding.')}
          target="_blank"
          rel="noopener noreferrer"
        />
        <SupportCard
          icon={Mail}
          title="Email"
          detail={SUPPORT_EMAIL}
          href={`mailto:${SUPPORT_EMAIL}`}
        />
        <SupportCard
          icon={MessageCircle}
          title="Call Us"
          detail={BUSINESS_WHATSAPP_DISPLAY}
          tone="red"
          href={`tel:${BUSINESS_WHATSAPP_DISPLAY.replace(/[^0-9+]/g, '')}`}
        />
      </div>
    </section>
  );
}