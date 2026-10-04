import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, CreditCard, Plus } from 'lucide-react';
import ProviderUnavailableCard from '@/components/vantoris/ProviderUnavailableCard';

// Cards product — Spec §6.
// Shows real cards if they exist, or a truthful unavailable state.
// Never exposes unsupported card functionality.
export default function Cards() {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        const c = await base44.entities.PaymentCard.filter({ user_id: me.id, status: 'active' }, '-created_date').catch(() => []);
        if (!cancelled) {
          setUser(me);
          setCards(c);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="vantoris-glass-header sticky top-0 z-10 px-5 py-4 safe-top">
        <div className="flex items-center gap-3 max-w-[430px] mx-auto">
          <Link to="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronLeft size={20} className="text-gray" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Cards</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-[430px] mx-auto">
        {cards.length > 0 ? (
          <div className="space-y-4">
            {cards.map(card => (
              <div key={card.id} className="relative overflow-hidden rounded-[30px] p-6 min-h-[205px] w-full text-white shadow-2xl bg-gradient-to-br from-[#0A2140] via-[#12355D] to-[#07162A]">
                <div className="absolute -right-14 -top-14 w-44 h-44 rounded-full border border-brass/20" />
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <span className="font-semibold tracking-[0.2em] text-sm">VANTORIS</span>
                    <p className="text-[9px] text-white/45 uppercase tracking-[0.14em] mt-1">{card.card_type || 'Debit'}</p>
                  </div>
                  <CreditCard size={23} className="text-white/70" />
                </div>
                <div className="relative z-10 mt-12 text-xl tracking-[0.23em]">•••• •••• •••• {card.last4}</div>
                <div className="relative z-10 mt-7 flex justify-between">
                  <div>
                    <p className="text-[9px] text-white/45 uppercase">Cardholder</p>
                    <p className="text-xs mt-1 uppercase">{card.cardholder_name || user?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/45 uppercase">Status</p>
                    <p className="text-xs mt-1 capitalize">{card.status || 'active'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProviderUnavailableCard
            providerName="Cards"
            description="No active cards yet. Card management — freeze, spending controls, disputes, and replacement — will be available once a card-issuing provider is connected."
            icon={CreditCard}
            actionLabel="View card services"
            actionRoute="/services"
          />
        )}
      </div>
    </div>
  );
}