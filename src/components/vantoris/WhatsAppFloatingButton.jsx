import React from "react";
import { MessageCircle } from "lucide-react";
import {
  useWhatsAppConfig,
  whatsappLinkFromConfig,
} from "@/hooks/useWhatsAppConfig";

export default function WhatsAppFloatingButton() {
  const whatsappNumber = useWhatsAppConfig();

  return (
    <a
      href={whatsappLinkFromConfig(
        whatsappNumber,
        "Hello VANTORIS Support, I need assistance with my account."
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with VANTORIS Support"
      className="
        fixed
        bottom-6
        right-6
        z-50
        group
      "
    >
      <div
        className="
          flex
          items-center
          justify-center
          w-16
          h-16
          rounded-full
          bg-gradient-to-br
          from-emerald-500
          to-emerald-600
          shadow-2xl
          border
          border-white/10
          transition-all
          duration-300
          group-hover:scale-110
          group-hover:shadow-emerald-500/40
        "
      >
        <MessageCircle size={28} className="text-white" />
      </div>

      <span
        className="
          absolute
          right-20
          top-1/2
          -translate-y-1/2
          whitespace-nowrap
          rounded-xl
          bg-[#16202B]
          px-4
          py-2
          text-sm
          text-white
          shadow-xl
          opacity-0
          group-hover:opacity-100
          transition-all
          duration-300
        "
      >
        Chat with Support
      </span>
    </a>
  );
}