import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Package, Loader2, ShoppingCart, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ProductCatalog from '@/components/vantoris/herobox/ProductCatalog';
import CheckoutFlow from '@/components/vantoris/herobox/CheckoutFlow';
import OrderHistory from '@/components/vantoris/herobox/OrderHistory';

const TABS = [
  { id: 'discover', label: 'Discover', icon: Sparkles },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'orders', label: 'My Orders', icon: Package },
];

export default function HeroBox() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    const profiles = await base44.entities.HeroBoxProfile.filter({ user_id: me.id }).catch(() => []);
    setProfile(profiles[0] || null);
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  async function handleActivate() {
    try {
      const me = await base44.auth.me();
      const created = await base44.entities.HeroBoxProfile.create({
        user_id: me.id,
        role: 'sponsor',
        status: 'active',
      });
      setProfile(created);
      toast({ title: 'HeroBox activated', description: 'You can now sponsor care packages and support heroes.' });
    } catch (err) {
      toast({ title: 'Activation failed', description: err.message, variant: 'destructive' });
    }
  }

  function handleAddToCart(product) {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id);
      if (existing) {
        return prev.map(c => c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        discount: product.discount || 0,
        quantity: 1,
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
    toast({ title: 'Order placed', description: 'Your HeroBox order has been created.' });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-brass" /></div>;
  }

  if (!profile) {
    return (
      <div className="px-5 pt-6 min-h-screen">
        <div className="vantoris-glass-premium p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brass/10 flex items-center justify-center mx-auto mb-4">
            <Heart size={32} className="text-brass" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">They are our heroes.<br />We can be theirs too.</h2>
          <p className="text-gray text-sm mb-6 leading-relaxed">
            Activate HeroBox to sponsor care packages, send support, and make a real difference for deployed service members, their families, and people in need.
          </p>
          <button onClick={handleActivate} className="w-full py-3.5 bg-brass text-white font-semibold rounded-xl hover:bg-brass/90 transition">
            Activate HeroBox
          </button>
        </div>
      </div>
    );
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="px-5 pt-6 pb-8 vantoris-scroll min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brass/10 border border-brass/15 flex items-center justify-center">
            <Heart size={22} className="text-brass" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">HeroBox</h1>
            <p className="text-xs text-gray">They are our heroes. We can be theirs too.</p>
          </div>
        </div>
        {cartCount > 0 && (
          <button
            onClick={() => setShowCheckout(true)}
            className="relative w-11 h-11 rounded-xl bg-navy flex items-center justify-center"
          >
            <ShoppingCart size={20} className="text-white" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brass text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 rounded-xl p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id ? 'bg-white text-navy shadow-sm' : 'text-gray'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'discover' && (
        <div>
          <div className="vantoris-glass-premium p-6 mb-5 text-center">
            <Sparkles size={28} className="text-brass mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground mb-1">Verified Needs & Stories</h3>
            <p className="text-gray text-xs leading-relaxed">
              Real stories from real people who need support. Every story is verified — Vantoris never fabricates people, needs, or emergencies.
            </p>
          </div>
          <div className="vantoris-glass p-6 text-center">
            <p className="text-gray text-sm">No verified stories are currently available.</p>
            <p className="text-xs text-gray mt-1">When verified needs are published by HeroBox administrators, they will appear here.</p>
            <button
              onClick={() => setActiveTab('shop')}
              className="mt-4 px-6 py-2.5 rounded-xl bg-brass text-white text-sm font-semibold"
            >
              Browse Care Packages
            </button>
          </div>
        </div>
      )}

      {activeTab === 'shop' && (
        <div>
          <ProductCatalog cart={cart} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} />
          {cartCount > 0 && (
            <button
              onClick={() => setShowCheckout(true)}
              className="fixed bottom-24 left-5 right-5 max-w-md mx-auto py-3.5 rounded-xl bg-brass text-white font-semibold shadow-lg flex items-center justify-center gap-2 z-40"
            >
              <ShoppingCart size={18} /> Checkout ({cartCount} item{cartCount !== 1 ? 's' : ''})
            </button>
          )}
        </div>
      )}

      {activeTab === 'orders' && <OrderHistory />}

      {showCheckout && (
        <CheckoutFlow
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onOrderComplete={handleOrderComplete}
        />
      )}
    </div>
  );
}