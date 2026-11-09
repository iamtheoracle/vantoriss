import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Minus, ShoppingCart, Loader2, Search, Wifi, Smartphone, Utensils, Heart, Home, Baby, Gift, BookOpen, ShieldCheck, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { HEROBOX_PACKAGES, buildPackage, isProductAvailableForDestination } from '@/lib/heroboxPackages';
import PackageShowcase from '@/components/vantoris/herobox/PackageShowcase';

const SERVICE_CATEGORIES = ['airtime_data', 'subscriptions', 'internet_access', 'wifi_devices'];
const CATEGORY_META = {
  essential: { label: 'Essentials', icon: Heart },
  comfort: { label: 'Comfort', icon: Home },
  body_care: { label: 'Personal care', icon: Heart },
  snack_food: { label: 'Food & groceries', icon: Utensils },
  groceries: { label: 'Food & groceries', icon: Utensils },
  mobile_tech: { label: 'Phones & tech', icon: Smartphone },
  phones: { label: 'Phones', icon: Smartphone },
  accessories: { label: 'Accessories', icon: Smartphone },
  airtime_data: { label: 'Airtime & data', icon: Wifi },
  subscriptions: { label: 'Subscriptions', icon: Wifi },
  internet_access: { label: 'Internet plans', icon: Wifi },
  wifi_devices: { label: 'Wi-Fi devices', icon: Wifi },
  baby_care: { label: 'Baby & children', icon: Baby },
  elder_care: { label: 'Elder care', icon: Heart },
  health_essentials: { label: 'Health essentials', icon: Heart },
  home_essentials: { label: 'Home essentials', icon: Home },
  clothing: { label: 'Clothing', icon: Gift },
  school_supplies: { label: 'School & learning', icon: BookOpen },
  gifts: { label: 'Gifts', icon: Gift },
  deployment_card: { label: 'Support cards', icon: Gift },
  premium: { label: 'Premium', icon: Tag },
  executive: { label: 'Executive', icon: Tag },
};

export default function ProductCatalog({ cart, onAddToCart, onRemoveFromCart, view = 'shop' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [destination, setDestination] = useState('');
  const [packages, setPackages] = useState([]);

  const loadData = useCallback(async () => {
    const prods = await base44.entities.HeroBoxProduct.filter({ status: 'active' }).catch(() => []);
    setProducts(prods);
    setPackages(HEROBOX_PACKAGES.map(pkg => buildPackage(pkg, prods, { destination })));
  }, [destination]);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  const visibleProducts = useMemo(() => products.filter(p => {
    const service = SERVICE_CATEGORIES.includes(p.category) || p.item_type === 'digital_service';
    return view === 'services' ? service : view === 'shop' ? !service : true;
  }), [products, view]);
  const categories = [...new Set(visibleProducts.map(p => p.category))];
  const filtered = visibleProducts.filter(p => {
    if (destination && !isProductAvailableForDestination(p, destination)) return false;
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return [p.name, p.description, p.category, p.source].some(value => (value || '').toLowerCase().includes(q));
    }
    return true;
  });
  const cartQuantity = id => cart.find(item => item.product_id === id)?.quantity || 0;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brass" /></div>;
  if (view === 'packages') return <PackageShowcase packages={packages} cart={cart} onAddToCart={onAddToCart} onRemoveFromCart={onRemoveFromCart} />;

  const heading = view === 'services' ? 'Stay connected' : 'Find what you need';
  const subheading = view === 'services' ? 'Phones, airtime, mobile data, Wi-Fi devices and internet plans.' : 'Everyday essentials, food, personal care, home, technology and thoughtful gifts.';
  const EmptyIcon = view === 'services' ? Wifi : ShoppingBag;

  return (
    <div>
      <div className="mb-4"><h2 className="text-lg font-bold text-foreground">{heading}</h2><p className="text-xs text-gray mt-1">{subheading}</p></div>
      <div className="relative mb-3">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={view === 'services' ? 'Search phones, data or internet...' : 'Search products and essentials...'} className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm shadow-sm focus:border-brass/50 focus:outline-none" />
      </div>
      <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Delivery or service destination" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs mb-3 focus:border-brass/50 focus:outline-none" />

      {categories.length > 0 && <div className="flex gap-2 overflow-x-auto pb-3 mb-2 vantoris-scroll">
        <button onClick={() => setActiveCategory('all')} className={`shrink-0 px-3.5 py-2 rounded-full text-[11px] font-semibold ${activeCategory === 'all' ? 'bg-navy text-white' : 'bg-slate-100 text-gray'}`}>All</button>
        {categories.map(cat => { const meta = CATEGORY_META[cat] || { label: cat.replace(/_/g, ' '), icon: Tag }; const Icon = meta.icon; return <button key={cat} onClick={() => setActiveCategory(cat)} className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold capitalize ${activeCategory === cat ? 'bg-navy text-white' : 'bg-slate-100 text-gray'}`}><Icon size={12} />{meta.label}</button>; })}
      </div>}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <span className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3"><EmptyIcon size={22} className="text-gray" /></span>
          <p className="text-sm font-semibold text-foreground">{visibleProducts.length ? 'No matches found' : view === 'services' ? 'Connectivity catalogue is being prepared' : 'The product catalogue is being prepared'}</p>
          <p className="text-xs text-gray mt-1 leading-relaxed">{visibleProducts.length ? 'Try another search or category.' : 'Only products and services with a configured provider, current price and confirmed availability will appear here. We will not display invented listings.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(product => {
            const qty = cartQuantity(product.id);
            const stale = ['stale', 'expired'].includes(product.freshness_status);
            const unavailable = product.availability !== 'available' || stale;
            const price = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
            const meta = CATEGORY_META[product.category] || { label: product.category?.replace(/_/g, ' ') || 'Product' };
            return <article key={product.id} className="rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm flex flex-col min-w-0">
              <div className="relative rounded-xl bg-slate-50 overflow-hidden aspect-[4/3] mb-2">
                {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Tag size={24} className="text-slate-300" /></div>}
                {product.discount > 0 && <span className="absolute top-2 left-2 rounded-full bg-rose-600 text-white px-2 py-1 text-[9px] font-bold">{product.discount}% off</span>}
                {product.is_featured && <span className="absolute top-2 right-2 rounded-full bg-[#14243b] text-white px-2 py-1 text-[9px] font-semibold">Featured</span>}
              </div>
              <p className="text-[10px] text-gray capitalize mb-1">{meta.label}</p>
              <h3 className="text-xs font-bold text-foreground leading-snug line-clamp-2">{product.name}</h3>
              {product.description && <p className="text-[10px] text-gray mt-1 line-clamp-2">{product.description}</p>}
              {product.source && <p className="text-[9px] text-gray mt-1">Provider: {product.source}</p>}
              <div className="mt-auto pt-2">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-sm font-extrabold text-foreground">{formatCurrency(price)}</span>
                  {product.discount > 0 && <span className="text-[10px] text-gray line-through">{formatCurrency(product.price)}</span>}
                </div>
                {product.retrieved_at && <p className="text-[9px] text-gray mt-0.5">Price checked {new Date(product.retrieved_at).toLocaleDateString()}</p>}
                {unavailable ? <p className="text-[10px] text-amber-700 mt-1">{stale ? 'Price needs refreshing' : product.availability === 'requires_config' ? 'Provider setup required' : 'Currently unavailable'}</p> : qty > 0 ? (
                  <div className="flex items-center justify-between mt-2"><button onClick={() => onRemoveFromCart(product)} aria-label={`Remove one ${product.name}`} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Minus size={14} /></button><span className="text-sm font-bold">{qty}</span><button onClick={() => onAddToCart(product)} aria-label={`Add one ${product.name}`} className="w-8 h-8 rounded-lg bg-navy text-white flex items-center justify-center"><Plus size={14} /></button></div>
                ) : <button onClick={() => onAddToCart(product)} className="w-full mt-2 py-2 rounded-xl bg-navy text-white text-[11px] font-bold flex items-center justify-center gap-1.5"><ShoppingCart size={12} /> Add to cart</button>}
              </div>
            </article>;
          })}
        </div>
      )}
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3"><ShieldCheck size={14} className="text-brass mt-0.5 shrink-0" /><p className="text-[10px] text-gray leading-relaxed">Prices, stock and service coverage depend on the provider and destination. A listing is purchasable only while its availability and price are current.</p></div>
    </div>
  );
}
