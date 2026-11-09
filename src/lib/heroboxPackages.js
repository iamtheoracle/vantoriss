/**
 * HeroBox Package Engine
 * Stable package identities; contents are assembled from current approved
 * catalogue records at request time. Never fabricate products or prices.
 */
export const HEROBOX_PACKAGES = [
  { id: 'hearth', name: 'HEARTH', purpose: 'Everyday essential support', description: 'Staple food, basic necessities and personal-care items.', categories: ['essential', 'snack_food', 'groceries', 'home_essentials'], color: 'bg-mint/10 text-mint', minItems: 3, maxItems: 8 },
  { id: 'haven', name: 'HAVEN', purpose: 'Essential support plus comfort', description: 'Food, personal care, comfort items and household essentials.', categories: ['essential', 'comfort', 'snack_food', 'groceries', 'home_essentials'], color: 'bg-champagne/10 text-champagne', minItems: 4, maxItems: 12 },
  { id: 'vitalis', name: 'VITALIS', purpose: 'Health, hygiene and personal care', description: 'Hygiene and approved everyday health-support supplies.', categories: ['body_care', 'health_essentials', 'comfort', 'essential'], color: 'bg-brass/10 text-brass', minItems: 3, maxItems: 10 },
  { id: 'provision', name: 'PROVISION', purpose: 'Food and household provision', description: 'Groceries, staple food, snacks, drinks and household provisions.', categories: ['snack_food', 'groceries', 'essential', 'home_essentials'], color: 'bg-navy/10 text-navy', minItems: 5, maxItems: 15 },
  { id: 'signal', name: 'SIGNAL', purpose: 'Communication support', description: 'Phones, airtime, mobile data, internet plans and connectivity accessories.', categories: ['mobile_tech', 'phones', 'airtime_data', 'subscriptions', 'internet_access', 'wifi_devices', 'accessories'], color: 'bg-champagne/10 text-champagne', minItems: 1, maxItems: 6 },
  { id: 'solace', name: 'SOLACE', purpose: 'Personal care and comfort', description: 'Food, hygiene, comfort and household essentials.', categories: ['comfort', 'body_care', 'snack_food', 'essential', 'home_essentials'], color: 'bg-brass/10 text-brass', minItems: 5, maxItems: 14 },
  { id: 'vanguard', name: 'VANGUARD', purpose: 'Comprehensive support', description: 'A broad combination of approved products tailored to the stated need.', categories: ['essential', 'comfort', 'body_care', 'snack_food', 'mobile_tech', 'phones', 'groceries'], color: 'bg-navy/10 text-navy', minItems: 6, maxItems: 20 },
  { id: 'sovereign', name: 'SOVEREIGN', purpose: 'Comprehensive premium support', description: 'The broadest appropriate combination of currently available approved products.', categories: ['essential', 'comfort', 'body_care', 'snack_food', 'mobile_tech', 'premium', 'executive', 'phones', 'groceries'], color: 'bg-brass/10 text-brass', minItems: 8, maxItems: 25 },
  { id: 'connect', name: 'CONNECT', purpose: 'Digital access and connectivity', description: 'A focused package for a phone, data, Wi-Fi access and charging essentials.', categories: ['phones', 'mobile_tech', 'airtime_data', 'subscriptions', 'internet_access', 'wifi_devices', 'accessories'], color: 'bg-sky-100 text-sky-800', minItems: 1, maxItems: 8 },
  { id: 'family', name: 'FAMILY', purpose: 'Family and children essentials', description: 'Food, baby care, school supplies and practical household basics.', categories: ['groceries', 'snack_food', 'baby_care', 'school_supplies', 'home_essentials', 'clothing'], color: 'bg-rose-100 text-rose-800', minItems: 3, maxItems: 12 },
  { id: 'eldercare', name: 'ELDERCARE', purpose: 'Support for older people', description: 'Everyday personal care, comfort, food and approved mobility-support products.', categories: ['elder_care', 'body_care', 'health_essentials', 'comfort', 'groceries', 'mobility_support'], color: 'bg-violet-100 text-violet-800', minItems: 3, maxItems: 12 },
  { id: 'resettlement', name: 'RESETTLEMENT', purpose: 'A fresh start at home', description: 'Household basics, clothing, food and practical supplies for families rebuilding daily life.', categories: ['home_essentials', 'essential', 'groceries', 'clothing', 'comfort'], color: 'bg-amber-100 text-amber-800', minItems: 4, maxItems: 15 },
];

export function buildPackage(pkgDef, products, options = {}) {
  const { destination, budget } = options;
  let eligible = products.filter(p => pkgDef.categories.includes(p.category) && p.status === 'active' && p.availability === 'available' && !['stale', 'expired'].includes(p.freshness_status));
  if (destination) eligible = eligible.filter(p => !p.destination || p.destination === '' || p.destination.toLowerCase() === destination.toLowerCase());
  eligible.sort((a, b) => (a.price || 0) - (b.price || 0));
  const selected = [];
  let subtotal = 0;
  for (const p of eligible) {
    if (selected.length >= pkgDef.maxItems) break;
    const unitPrice = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
    if (budget && subtotal + unitPrice > budget) continue;
    selected.push({ product_id: p.id, name: p.name, category: p.category, price: unitPrice, original_price: p.price, discount: p.discount || 0, quantity: 1, source: p.source || '', currency: p.currency || 'USD', freshness_status: p.freshness_status || 'current' });
    subtotal += unitPrice;
  }
  const available = selected.length >= pkgDef.minItems;
  const shippingCost = available && selected.some(item => item.item_type !== 'digital_service') ? 15 : 0;
  return { packageId: pkgDef.id, name: pkgDef.name, purpose: pkgDef.purpose, description: pkgDef.description, color: pkgDef.color, items: selected, itemCount: selected.length, subtotal, shippingCost, total: available ? subtotal + shippingCost : 0, available, unavailableReason: !available ? 'Not enough current catalogue products are available for this package.' : null, pricingTimestamp: new Date().toISOString() };
}

export function buildAllPackages(products, options = {}) { return HEROBOX_PACKAGES.map(def => buildPackage(def, products, options)); }
export function getPackageDefinition(packageId) { return HEROBOX_PACKAGES.find(p => p.id === packageId); }
export function isProductAvailableForDestination(product, destination) {
  if (!product.destination || product.destination === '') return true;
  return product.destination.toLowerCase() === (destination || '').toLowerCase();
}
export function computeFreshnessStatus(retrievedAt, maxAgeHours = 24) {
  if (!retrievedAt) return 'unavailable';
  const ageHours = (Date.now() - new Date(retrievedAt).getTime()) / 3600000;
  if (ageHours > maxAgeHours * 3) return 'stale';
  if (ageHours > maxAgeHours) return 'recent';
  return 'current';
}
export function createOrderSnapshot(cartItems, packageData = null) {
  const snapshot = { snapshot_timestamp: new Date().toISOString(), items: cartItems.map(item => ({ product_id: item.product_id, name: item.name, category: item.category, unit_price: item.price, original_price: item.original_price || item.price, discount: item.discount || 0, quantity: item.quantity, source: item.source || '', currency: item.currency || 'USD', item_type: item.item_type || 'physical', freshness_status: item.freshness_status || 'current' })) };
  if (packageData) snapshot.package = { package_id: packageData.packageId, name: packageData.name, purpose: packageData.purpose, items: packageData.items, subtotal: packageData.subtotal };
  return snapshot;
}
export function getAvailableProducts(products) { return products.filter(p => p.status === 'active' && p.availability === 'available' && !['stale', 'expired'].includes(p.freshness_status)); }
export function markStaleProducts(products, maxAgeHours = 72) { return products.map(p => ({ ...p, freshness_status: computeFreshnessStatus(p.retrieved_at, maxAgeHours) })); }
export function regeneratePackageWithReplacement(pkgDef, currentItems, allProducts, options = {}) {
  const fresh = buildPackage(pkgDef, allProducts, options);
  return { items: fresh.items, replacedCount: Math.max(0, fresh.items.length - currentItems.length), replacements: [], subtotal: fresh.subtotal, available: fresh.available };
}
