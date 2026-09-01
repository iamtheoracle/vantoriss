import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Minus, ShoppingCart, Loader2, AlertCircle, Package, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { HEROBOX_PACKAGES, buildPackage, isProductAvailableForDestination } from '@/lib/heroboxPackages';
import PackageShowcase from '@/components/vantoris/herobox/PackageShowcase';

export default function ProductCatalog({ cart, onAddToCart, onRemoveFromCart, view = 'shop' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [destination, setDestination] = useState('');
  const [packages, setPackages] = useState([]);

  const loadData = useCallback(async () => {
    const prods = await base44.entities.HeroBoxProduct.filter({ status: 'active' }).catch(() => []);
    setProducts(prods);
    // Build dynamic packages from current catalog
    const builtPackages = HEROBOX_PACKAGES.map((pkgDef) => buildPackage(pkgDef, prods, { destination }));
    setPackages(builtPackages);
  }, [destination]);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brass" /></div>;

  if (products.length === 0) {
    return (
      <div className="vantoris-glass p-8 text-center">
        <AlertCircle size={32} className="text-gray mx-auto mb-3" />
        <p className="text-foreground text-sm font-semibold">No Products Available</p>
        <p className="text-gray text-xs mt-1">
          The HeroBox catalog is being configured. Products will appear here once a commerce provider is connected and product discovery is activated.
        </p>
      </div>
    );
  }

  // Destination-aware filtering
  let filtered = products;
  if (destination) {
    filtered = filtered.filter((p) => isProductAvailableForDestination(p, destination));
  }
  if (activeCategory) {
    filtered = filtered.filter((p) => p.category === activeCategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }

  const categories = [...new Set(products.map((p) => p.category))];

  function getCartQuantity(productId) {
    return cart.find((c) => c.product_id === productId)?.quantity || 0;
  }

  // PACKAGES VIEW — show the 8 approved packages with dynamic contents
  if (view === 'packages') {
    return <PackageShowcase packages={packages} cart={cart} onAddToCart={onAddToCart} onRemoveFromCart={onRemoveFromCart} />;
  }

  // SHOP VIEW — individual products + category filter
  return (
    <div>
      {/* Destination selector */}
      <div className="mb-4">
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination country/region (optional)"
          className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm focus:border-brass/50 focus:outline-none"
        />
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:border-brass/50 focus:outline-none"
        />
      </div>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!activeCategory ? 'bg-navy text-white' : 'bg-slate-100 text-gray'}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition capitalize ${activeCategory === cat ? 'bg-navy text-white' : 'bg-slate-100 text-gray'}`}
          >
            {cat.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Individual products */}
      {filtered.length === 0 ? (
        <div className="vantoris-glass p-6 text-center">
          <p className="text-gray text-sm">No products match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product) => {
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
                {product.source && <p className="text-[10px] text-gray">via {product.source}</p>}
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
      )}
    </div>
  );
}