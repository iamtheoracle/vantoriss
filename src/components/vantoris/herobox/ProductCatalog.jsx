import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, Plus, Minus, ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

const PACKAGE_STAGES = [
  { id: 'essential', label: 'Essential / Starter', desc: 'Small, practical care items', color: 'bg-mint/10 text-mint' },
  { id: 'comfort', label: 'Comfort', desc: 'Personal-care and comfort items', color: 'bg-champagne/10 text-champagne' },
  { id: 'body_care', label: 'Body Care', desc: 'Hygiene and personal-care products', color: 'bg-brass/10 text-brass' },
  { id: 'snack_food', label: 'Snack / Food', desc: 'Snacks and food items', color: 'bg-navy/10 text-navy' },
  { id: 'mobile_tech', label: 'Mobile / Tech', desc: 'Phones, accessories, airtime, data', color: 'bg-champagne/10 text-champagne' },
  { id: 'premium', label: 'Premium / Exclusive', desc: 'Higher-value curated selections', color: 'bg-brass/10 text-brass' },
  { id: 'executive', label: 'Executive', desc: 'Comprehensive premium package', color: 'bg-navy/10 text-navy' },
  { id: 'executive_plus', label: 'Executive Plus', desc: 'The highest curated package', color: 'bg-brass/10 text-brass' },
];

export default function ProductCatalog({ cart, onAddToCart, onRemoveFromCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  const loadData = useCallback(async () => {
    const prods = await base44.entities.HeroBoxProduct.filter({ status: 'active' }).catch(() => []);
    setProducts(prods);
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brass" /></div>;

  if (products.length === 0) {
    return (
      <div className="vantoris-glass p-8 text-center">
        <AlertCircle size={32} className="text-gray mx-auto mb-3" />
        <p className="text-foreground text-sm font-semibold">No Products Available</p>
        <p className="text-gray text-xs mt-1">
          The HeroBox catalog is being configured. Products will appear here once they are added by HeroBox administrators.
        </p>
      </div>
    );
  }

  const categories = [...new Set(products.map(p => p.category))];
  const filtered = activeCategory ? products.filter(p => p.category === activeCategory) : products;

  function getCartQuantity(productId) {
    return cart.find(c => c.product_id === productId)?.quantity || 0;
  }

  return (
    <div>
      {/* Package stages */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-foreground mb-3">Care Package Stages</h3>
        <div className="grid grid-cols-2 gap-3">
          {PACKAGE_STAGES.map(stage => {
            const stageProducts = products.filter(p => p.category === stage.id);
            const stagePrice = stageProducts.reduce((s, p) => s + (p.price || 0), 0);
            return (
              <button
                key={stage.id}
                onClick={() => setActiveCategory(activeCategory === stage.id ? null : stage.id)}
                className={`vantoris-glass p-4 text-left transition ${activeCategory === stage.id ? 'ring-2 ring-brass' : ''}`}
              >
                <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2 ${stage.color}`}>
                  {stage.label}
                </div>
                <p className="text-xs text-gray">{stage.desc}</p>
                {stageProducts.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-[10px] text-gray">{stageProducts.length} items included</p>
                    <p className="text-sm font-bold text-foreground mt-1">{formatCurrency(stagePrice)}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray mt-2">Coming soon</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter */}
      {activeCategory && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-gray">
            Showing: <span className="font-semibold text-foreground capitalize">{activeCategory.replace(/_/g, ' ')}</span>
          </p>
          <button onClick={() => setActiveCategory(null)} className="text-xs text-brass font-medium">Show all</button>
        </div>
      )}

      {/* Individual products */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(product => {
          const qty = getCartQuantity(product.id);
          const isStale = product.freshness_status === 'stale' || product.freshness_status === 'expired';
          const isUnavailable = product.availability !== 'available' || isStale;
          const finalPrice = product.discount > 0
            ? product.price * (1 - product.discount / 100)
            : product.price;
          return (
            <div key={product.id} className="vantoris-glass p-3 flex flex-col">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-full h-24 rounded-lg object-cover mb-2" />
              )}
              <p className="text-sm font-semibold text-foreground leading-tight">{product.name}</p>
              <p className="text-[10px] text-gray capitalize mt-0.5">{(product.category || '').replace(/_/g, ' ')}</p>
              {product.destination && <p className="text-[10px] text-gray">📍 {product.destination}</p>}
              <div className="mt-2">
                {product.discount > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray line-through">{formatCurrency(product.price)}</span>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(finalPrice)}</span>
                    <span className="text-[10px] text-mint font-medium">-{product.discount}%</span>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-foreground">{formatCurrency(product.price)}</p>
                )}
              </div>
              {isUnavailable && (
                <p className="text-[10px] text-warning mt-1">
                  {isStale ? 'Pricing may be stale' : 'Unavailable'}
                </p>
              )}
              <div className="mt-auto pt-2">
                {isUnavailable ? (
                  <button disabled className="w-full py-1.5 rounded-lg bg-slate-100 text-gray text-xs font-medium">
                    Unavailable
                  </button>
                ) : qty > 0 ? (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onRemoveFromCart(product)}
                      className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-foreground"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold text-foreground">{qty}</span>
                    <button
                      onClick={() => onAddToCart(product)}
                      className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onAddToCart(product)}
                    className="w-full py-1.5 rounded-lg bg-navy/10 text-navy text-xs font-semibold hover:bg-navy/20 transition flex items-center justify-center gap-1"
                  >
                    <ShoppingCart size={12} /> Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}