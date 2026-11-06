import React from 'react';
import { CreditCard, ShieldCheck, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';

const designs = [
  { title: 'Everyday Debit', image: '/cards/avcu-everyday-debit.svg', category: 'Member debit' },
  { title: 'Member Credit', image: '/cards/avcu-member-credit.svg', category: 'Member credit' },
  { title: 'Virtual Debit', image: '/cards/avcu-virtual-debit.svg', category: 'Digital card' },
  { title: 'Business Debit', image: '/cards/avcu-business-debit.svg', category: 'Business debit' },
];

export default function Cards() {
  const navigate = useNavigate();
  return (
    <OperationsPageLayout title="Card Programme" description="Card product designs, issuer readiness and controlled operations" icon={CreditCard}>
      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#173D32]/10 text-[#173D32] flex items-center justify-center shrink-0"><ShieldCheck size={21} /></div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-foreground">Card programme workspace</h2>
            <p className="text-sm text-gray mt-1 leading-relaxed">Review the institution’s card design system and issuer readiness. Member card records appear here only after an authorized issuer integration supplies verified card data.</p>
            <p className="text-xs text-[#80683D] mt-3">Issuance and card controls remain gated until provider connectivity, member eligibility checks and server-side authorization workflows are verified.</p>
          </div>
        </div>
        <button onClick={() => navigate('/operations/integrations')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#173D32] text-white px-4 py-2.5 text-sm font-semibold">
          <Settings2 size={15} /> Review issuer integrations
        </button>
      </section>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[.16em] font-bold text-[#8B7650]">Institutional artwork</p>
          <h2 className="text-lg font-bold text-foreground mt-1">Card design library</h2>
        </div>
        <span className="text-xs text-gray">4 previews</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {designs.map(card => (
          <article key={card.title} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <img src={card.image} alt={card.title + ' design preview'} className="block w-full aspect-[1.62] object-cover" />
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#8B7650] font-bold">{card.category}</p>
              <h3 className="font-semibold text-foreground mt-1">{card.title}</h3>
              <p className="text-xs text-gray mt-2">Design preview · issuer availability must be confirmed</p>
            </div>
          </article>
        ))}
      </div>
    </OperationsPageLayout>
  );
}
