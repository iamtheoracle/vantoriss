import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CreditCard, ShieldCheck } from 'lucide-react';

const CARD_DESIGNS = [
  { title: 'Everyday Debit', image: '/cards/avcu-everyday-debit.svg', description: 'A clean everyday card design for member spending.' },
  { title: 'Member Credit', image: '/cards/avcu-member-credit.svg', description: 'A refined member credit card design concept.' },
  { title: 'Virtual Debit', image: '/cards/avcu-virtual-debit.svg', description: 'A digital-first card concept for online and wallet use.' },
  { title: 'Business Debit', image: '/cards/avcu-business-debit.svg', description: 'A distinct design direction for business members.' },
];

export default function CardShowcase({ cards = [] }) {
  const navigate = useNavigate();
  const hasActiveCards = cards.length > 0;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] uppercase tracking-[.16em] font-bold text-[#8B7650]">Member cards</p>
          <h2 className="text-base font-bold text-foreground mt-1">{hasActiveCards ? 'Your cards' : 'Explore card designs'}</h2>
        </div>
        <button onClick={() => navigate('/services')} className="text-xs font-semibold text-[#173D32] inline-flex items-center gap-1">
          Card services <ArrowUpRight size={14} />
        </button>
      </div>

      {hasActiveCards ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.slice(0, 2).map(card => {
            const image = card.card_type === 'virtual' ? '/cards/avcu-virtual-debit.svg' : card.card_type === 'credit' ? '/cards/avcu-member-credit.svg' : '/cards/avcu-everyday-debit.svg';
            return (
              <button key={card.id} onClick={() => navigate('/cards')} className="text-left rounded-2xl overflow-hidden border border-border bg-white shadow-sm">
                <div className="relative">
                  <img src={image} alt={`Atchison Village ${card.card_type || 'debit'} card design`} className="w-full aspect-[1.62] object-cover" />
                  <span className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#173D32] inline-flex items-center gap-1">
                    <ShieldCheck size={12} /> Active
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground capitalize">{card.card_type || 'Debit'} card</p>
                    <p className="text-xs text-gray mt-0.5">•••• {card.last4 || '••••'}</p>
                    <p className="text-[10px] text-gray/70 mt-1">Illustrative design · issuer artwork not synced</p>
                  </div>
                  <CreditCard size={18} className="text-[#C5A66A]" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CARD_DESIGNS.map(card => (
              <article key={card.title} className="rounded-2xl overflow-hidden border border-border bg-white shadow-sm">
                <img src={card.image} alt={`${card.title} card design preview for Atchison Village Credit Union`} className="block w-full aspect-[1.62] object-cover" loading="lazy" />
                <div className="px-4 py-3">
                  <p className="font-semibold text-sm text-foreground">{card.title}</p>
                  <p className="text-xs text-gray mt-1">{card.description}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-gray px-1">These are product design previews. Card availability and issuance depend on member eligibility and a confirmed issuer connection.</p>
          <button onClick={() => navigate('/services')} className="w-full rounded-xl bg-[#173D32] text-white font-semibold text-sm py-3.5 hover:bg-[#102C25] transition-colors">
            Explore card services
          </button>
        </>
      )}
    </section>
  );
}
