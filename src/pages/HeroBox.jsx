import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart, ShoppingBag, Package, Loader2, ShoppingCart, Wifi, Smartphone, Gift, ClipboardList, Sparkles, ArrowRight, Tag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ProductCatalog from '@/components/vantoris/herobox/ProductCatalog';
import CheckoutFlow from '@/components/vantoris/herobox/CheckoutFlow';
import OrderHistory from '@/components/vantoris/herobox/OrderHistory';
import DonationFlow from '@/components/vantoris/herobox/DonationFlow';
import DiscoverFeed from '@/components/vantoris/herobox/DiscoverFeed';

const TABS = [
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'deals', label: 'Offers', icon: Tag },
  { id: 'connectivity', label: 'Phones & Internet', icon: Wifi },
  { id: 'donate', label: 'Donate', icon: Heart },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
];

const QUICK_LINKS = [
  { icon: Package, label: 'Care packages', detail: 'Ready-made support', tab: 'packages' },
  { icon: Smartphone, label: 'Phones', detail: 'Devices & accessories', tab: 'connectivity' },
  { icon: Wifi, label: 'Internet & data', detail: 'Stay connected', tab: 'connectivity' },
  { icon: Gift, label: 'Gifts', detail: 'Send something thoughtful', tab: 'shop' },
];

export default function HeroBox() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    const profiles = await base44.entities.HeroBoxProfile.filter({ user_id: me.id }).catch(() => []);
    if (profiles[0]) {
      setProfile(profiles[0]);
      return;
    }
    try {
      const created = await base44.entities.HeroBoxProfile.create({ user_id: me.id, role: 'sponsor', status: 'active' });
      setProfile(created);
    } catch (error) {
      const retry = await base44.entities.HeroBoxProfile.filter({ user_id: me.id }).catch(() => []);
      setProfile(retry[0] || null);
    }
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  function handleAddToCart(product) {
    setCart(prev => {
      const currency = product.currency || 'USD';
      if (prev.length > 0 && prev.some(item => (item.currency || 'USD') !== currency)) {
        toast({ title: 'Keep one currency per cart', description: 'Please finish this cart before adding items priced in another currency.', variant: 'destructive' });
        return prev;
      }
      const existing = prev.find(c => c.product_id === product.id);
      if (existing) return prev.map(c => c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, {
        product_id: product.id, name: product.name, category: product.category,
        price: product.price, original_price: product.price, discount: product.discount || 0,
        currency: product.currency || 'USD', source: product.source || '',
        item_type: product.item_type || 'physical', quantity: 1
      }];
    });
  }

  function handleRemoveFromCart(product) {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter(c => c.product_id !== product.id);
      return prev.map(c => c.product_id === product.id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  function handleOrderComplete() {
    setCart([]);
    setActiveTab('orders');
    toast({ title: 'Order created', description: 'Your order is saved and will appear in your order history.' });
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-brass" /></div>;
  if (!profile) return <div className="px-5 pt-6 min-h-screen"><div className="vantoris-glass-premium p-8 text-center"><Heart size={32} className="text-brass mx-auto mb-4" /><h2 className="text-xl font-bold text-foreground mb-2">HeroBox is temporarily unavailable</h2><p className="text-gray text-sm leading-relaxed">We could not initialize your HeroBox membership. Please refresh and try again.</p></div></div>;

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="px-4 sm:px-5 pt-5 pb-32 vantoris-scroll min-h-screen max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brass/10 border border-brass/15 flex items-center justify-center"><Heart size={22} className="text-brass" /></div>
          <div><h1 className="text-xl font-bold text-foreground">HeroBox</h1><p className="text-xs text-gray">Care, essentials and connection in one place.</p></div>
        </div>
        {cartCount > 0 && <button onClick={() => setShowCheckout(true)} aria-label="Open cart" className="relative w-11 h-11 rounded-xl bg-navy flex items-center justify-center text-white">
          <ShoppingCart size={19} />
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-brass text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>
        </button>}
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-[#14243b] p-5 sm:p-6 mb-4 text-white">
        <div className="absolute -right-12 -top-16 w-48 h-48 rounded-full bg-brass/20 blur-3xl" />
        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-bold text-[#e4c88b] mb-2"><Sparkles size={12} /> The HeroBox experience</span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">A little help can go a long way.</h2>
          <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-4">Build a care package, send essentials, top up connectivity or support a verified humanitarian need.</p>
          <button onClick={() => setActiveTab('packages')} className="inline-flex items-center gap-2 rounded-xl bg-[#d4b36b] px-4 py-2.5 text-xs font-bold text-[#14243b]">Explore packages <ArrowRight size={14} /></button>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-2 mb-5">
        {QUICK_LINKS.map(item => { const Icon = item.icon; return (
          <button key={item.label} onClick={() => setActiveTab(item.tab)} className="min-w-0 rounded-2xl bg-white border border-slate-100 shadow-sm p-2.5 text-center hover:border-brass/40 transition">
            <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-1.5"><Icon size={17} className="text-navy" /></span>
            <span className="block text-[10px] sm:text-xs font-bold text-foreground leading-tight">{item.label}</span>
            <span className="hidden sm:block text-[10px] text-gray mt-0.5">{item.detail}</span>
          </button>
        ); })}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 vantoris-scroll">
        {TABS.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${activeTab === tab.id ? 'bg-navy text-white shadow-sm' : 'bg-slate-100 text-gray hover:bg-slate-200'}`}><Icon size={14} /> {tab.label}</button>; })}
      </div>

      {activeTab === 'packages' && <ProductCatalog cart={cart} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} view="packages" />}
      {activeTab === 'shop' && <ProductCatalog cart={cart} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} view="shop" />}
      {activeTab === 'deals' && <ProductCatalog cart={cart} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} view="deals" />}
      {activeTab === 'connectivity' && <ProductCatalog cart={cart} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} view="services" />}
      {activeTab === 'orders' && <OrderHistory />}
      {activeTab === 'donate' && <div>
        <div className="rounded-2xl bg-[#14243b] p-5 mb-4 text-white"><Heart size={23} className="text-[#e4c88b] mb-3" /><h3 className="text-lg font-bold mb-1">Give with purpose.</h3><p className="text-white/70 text-xs leading-relaxed">Explore verified needs involving service members, children, older people, refugees, displaced families and communities affected by conflict or disasters. Follow the evidence and see reported impact.</p></div>
        <button onClick={() => setShowDonation(true)} className="w-full py-3.5 rounded-xl bg-brass text-white font-semibold flex items-center justify-center gap-2 mb-5"><Heart size={17} /> Support a verified cause</button>
        <DiscoverFeed onShop={() => setActiveTab('shop')} onDonate={() => setShowDonation(true)} />
      </div>}

      {cartCount > 0 && <div className="fixed bottom-20 left-4 right-4 max-w-2xl mx-auto z-40"><button onClick={() => setShowCheckout(true)} className="w-full py-3.5 rounded-2xl bg-navy text-white font-semibold shadow-xl flex items-center justify-center gap-2"><ShoppingCart size={17} /> View cart · {cartCount} item{cartCount !== 1 ? 's' : ''}</button></div>}
      {showCheckout && <CheckoutFlow cart={cart} onClose={() => setShowCheckout(false)} onOrderComplete={handleOrderComplete} />}
      {showDonation && <DonationFlow onClose={() => setShowDonation(false)} onOrderComplete={() => setActiveTab('orders')} />}
    </div>
  );
}
