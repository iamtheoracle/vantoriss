import React from 'react';
import { Plus, Minus, ShoppingCart, Package as PackageIcon, AlertCircle, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

/**
 * PackageShowcase — Displays the 8 approved HeroBox packages with
 * dynamically built contents from the current verified catalog.
 *
 * Package names are STABLE. Contents are NOT hard-coded — they are
 * rebuilt from the current catalog at render time.
 */
export default function PackageShowcase({ packages, cart, onAddToCart, onRemoveFromCart }) {
  function getCartQuantity(productId) {
    return cart.find((c) => c.product_id === productId)?.quantity || 0;
  }

  return (
    <div className="space-y-4">
      <div className="vantoris-glass-premium p-4 text-center">
        <PackageIcon size={24} className="text-brass mx-auto mb-2" />
        <h3 className="text-base font-bold text-foreground mb-1">Curated Care Packages</h3>
        <p className="text-gray text-xs leading-relaxed">
          Each package is dynamically built from currently available verified products.
          Package contents update as the catalog changes — the package name stays the same.
        </p>
      </div>

      {packages.map((pkg) => (
        <div key={pkg.packageId} className="vantoris-glass p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-1.5 ${pkg.color}`}>
                {pkg.name}
              </div>
              <p className="text-sm font-bold text-foreground">{pkg.purpose}</p>
              <p className="text-xs text-gray mt-0.5">{pkg.description}</p>
            </div>
            <div className="text-right">
              {pkg.available ? (
                <>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(pkg.total)}</p>
                  <p className="text-[10px] text-gray">{pkg.itemCount} items</p>
                </>
              ) : (
                <p className="text-xs text-warning font-medium">Unavailable</p>
              )}
            </div>
          </div>

          {pkg.available ? (
            <>
              {/* Package contents */}
              <div className="space-y-1 mb-3">
                {pkg.items.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray truncate">{item.name}</span>
                    <span className="text-foreground font-medium">{formatCurrency(item.price)}</span>
                  </div>
                ))}
                {pkg.items.length > 4 && (
                  <p className="text-[10px] text-gray">+ {pkg.items.length - 4} more items</p>
                )}
              </div>

              {/* Add entire package to cart */}
              <AddPackageButton pkg={pkg} onAddToCart={onAddToCart} />
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-warning">
              <AlertCircle size={14} />
              <span>{pkg.unavailableReason || 'Not enough products available for this package'}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddPackageButton({ pkg, onAddToCart }) {
  const [added, setAdded] = React.useState(false);

  function handleAdd() {
    // Add all items in the package to the cart
    pkg.items.forEach((item) => {
      onAddToCart({
        id: item.product_id,
        name: item.name,
        category: item.category,
        price: item.price,
        discount: item.discount,
        source: item.source,
        freshness_status: item.freshness_status,
      });
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleAdd}
      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
        added ? 'bg-mint text-white' : 'bg-navy text-white hover:bg-navy/90'
      }`}
    >
      {added ? (
        <><Check size={16} /> Package Added</>
      ) : (
        <><ShoppingCart size={14} /> Add {pkg.name} Package — {formatCurrency(pkg.total)}</>
      )}
    </button>
  );
}