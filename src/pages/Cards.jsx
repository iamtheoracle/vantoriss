import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, CreditCard } from 'lucide-react';
import CardShowcase from '@/components/vantoris/home/CardShowcase';
import VantorisLogo from '@/components/vantoris/brand/VantorisLogo';

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        const rows = await base44.entities.PaymentCard.filter({ user_id: me.id }, '-created_date').catch(() => []);
        if (!cancelled) setCards(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error('Card records could not load', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#C5A66A]/30 border-t-[#173D32] rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-border px-4 sm:px-6 py-3 safe-top">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/" aria-label="Back to member home" className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ChevronLeft size={20} className="text-gray" />
          </Link>
          <div className="flex-1"><VantorisLogo size={30} variant="flat" theme="light" /></div>
          <CreditCard size={19} className="text-[#C5A66A]" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28">
        <p className="text-[10px] uppercase tracking-[.16em] text-[#8B7650] font-bold">Member cards</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">Your card centre</h1>
        <p className="text-sm text-gray mt-2 mb-6">View card records linked to your membership and explore the Atchison Village card collection.</p>
        <CardShowcase cards={cards} />
      </main>
    </div>
  );
}
