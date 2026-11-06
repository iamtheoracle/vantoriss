import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CreditCard, ShieldCheck, Clock3, CheckCircle2, LockKeyhole } from 'lucide-react';

const CARD_DESIGNS = [
  { title: 'Everyday Debit', image: '/cards/avcu-everyday-debit.svg', type: 'debit', description: 'For everyday purchases and member spending.' },
  { title: 'Member Credit', image: '/cards/avcu-member-credit.svg', type: 'credit', description: 'A considered credit-card design for eligible members.' },
  { title: 'Virtual Debit', image: '/cards/avcu-virtual-debit.svg', type: 'virtual', description: 'A digital-first card design for online and wallet use.' },
  { title: 'Business Debit', image: '/cards/avcu-business-debit.svg', type: 'business', description: 'A distinct design direction for business members.' },
];

function cardArtwork(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('business')) return '/cards/avcu-business-debit.svg';
  if (normalized.includes('credit')) return '/cards/avcu-member-credit.svg';
  if (normalized.includes('virtual')) return '/cards/avcu-virtual-debit.svg';
  return '/cards/avcu-everyday-debit.svg';
}

function statusPresentation(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return { label: 'Active', icon: CheckCircle2, tone: 'text-[#173D32] bg-[#EAF1EC]' };
  if (normalized === 'issued') return { label: 'Issued', icon: CreditCard, tone: 'text-[#173D32] bg-[#EAF1EC]' };
  if (normalized === 'approved') return { label: 'Approved', icon: ShieldCheck, tone: 'text-[#66532E] bg-[#F5EEDC]' };
  if (normalized === 'pending' || normalized === 'processing') return { label: 'In progress', icon: Clock3, tone: 'text-[#66532E] bg-[#F5EEDC]' };
  if (normalized === 'blocked' || normalized === 'suspended') return { label: 'Temporarily restricted', icon: LockKeyhole, tone: 'text-[#8B3E36] bg-[#F8EAE7]' };
  if (normalized === 'cancelled' || normalized === 'closed') return { label: 'Closed', icon: CreditCard, tone: 'text-[#68766F] bg-[#F0F1EE]' };
  if (normalized === 'not_issued' || normalized === 'not-issued') return { label: 'Application needed', icon: CreditCard, tone: 'text-[#68766F] bg-[#F0F1EE]' };
  return { label: 'Status pending confirmation', icon: Clock3, tone: 'text-[#68766F] bg-[#F0F1EE]' };
}

export default function CardShowcase({ cards = [] }) {
  const navigate = useNavigate();
  const hasRecords = Array.isArray(cards) && cards.length > 0;

  return (
    <section className="space-y-4">
      {hasRecords ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.slice(0, 4).map(card => {
            const status = statusPresentation(card.status);
            const StatusIcon = status.icon;
            return (
              <button key={card.id} onClick={() => navigate('/cards')} className="text-left rounded-2xl overflow-hidden border border-[#E5DDCA] bg-white hover:border-[#C5A66A] transition-colors">
                <div className="relative bg-[#F7F4EC]">
                  <img src={cardArtwork(card.card_type)} alt="Atchison Village card design preview" className="block w-full aspect-[1.62] object-cover" />
                  <span className={'absolute top-3 right-3 rounded-full px-2.5 py-1.5 text-[10px] font-bold inline-flex items-center gap-1 ' + status.tone}>
                    <StatusIcon size={12} /> {status.label}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[#173D32] capitalize">{String(card.card_type || 'Member').replace(/[-_]/g, ' ')} card</p>
                    <p className="text-xs text-[#68766F] mt-0.5">{card.last4 ? 'Ending in ' + card.last4 : 'Member card record'}</p>
                    <p className="text-[10px] text-[#68766F] mt-1">Design preview · card details follow the verified record</p>
                  </div>
                  <CreditCard size={18} className="text-[#C5A66A] shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CARD_DESIGNS.map(card => (
              <article key={card.title} className="rounded-2xl overflow-hidden border border-[#E5DDCA] bg-white">
                <div className="bg-[#F7F4EC]">
                  <img src={card.image} alt={card.title + ' design preview for Atchison Village Credit Union'} className="block w-full aspect-[1.62] object-cover" loading="lazy" />
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-[#173D32]">{card.title}</p>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#8B7650] bg-[#F7F4EC] rounded-full px-2 py-1">Design preview</span>
                  </div>
                  <p className="text-xs text-[#68766F] mt-1">{card.description}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-[#68766F]">These images show the institution’s card designs. They are not proof that a card has been approved, issued or activated. Your actual card status is shown from your member record.</p>
        </>
      )}
      <button onClick={() => navigate('/cards')} className="w-full rounded-xl bg-[#173D32] text-white font-semibold text-sm py-3.5 hover:bg-[#102C25] transition-colors inline-flex items-center justify-center gap-2">
        Explore card services <ArrowUpRight size={15} />
      </button>
    </section>
  );
}
