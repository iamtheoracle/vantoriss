/**
 * HeroBox Package Engine
 *
 * Approved package names are STABLE. Package contents are dynamically
 * determined from the current verified catalog — they are NOT hard-coded.
 *
 * HEARTH  — Everyday essential support
 * HAVEN   — Essential support plus comfort
 * VITALIS — Health, hygiene and personal-care support
 * PROVISION — Substantial food and household provision
 * SIGNAL  — Communication support (phones, airtime, data, subscriptions)
 * SOLACE  — Broad personal care and comfort
 * VANGUARD — Comprehensive support
 * SOVEREIGN — Highest-level curated support
 */

export const HEROBOX_PACKAGES = [
  {
    id: 'hearth',
    name: 'HEARTH',
    purpose: 'Everyday essential support',
    description: 'Staple food, basic necessities, and simple personal-care items.',
    categories: ['essential', 'snack_food'],
    color: 'bg-mint/10 text-mint',
    accent: 'mint',
    minItems: 3,
    maxItems: 8,
  },
  {
    id: 'haven',
    name: 'HAVEN',
    purpose: 'Essential support plus comfort',
    description: 'Food, personal care, comfort items, and household essentials.',
    categories: ['essential', 'comfort', 'snack_food'],
    color: 'bg-champagne/10 text-champagne',
    accent: 'champagne',
    minItems: 4,
    maxItems: 12,
  },
  {
    id: 'vitalis',
    name: 'VITALIS',
    purpose: 'Health, hygiene and personal-care support',
    description: 'Hygiene, personal care, wellness-related everyday supplies, and approved health-support products.',
    categories: ['body_care', 'comfort', 'essential'],
    color: 'bg-brass/10 text-brass',
    accent: 'brass',
    minItems: 3,
    maxItems: 10,
  },
  {
    id: 'provision',
    name: 'PROVISION',
    purpose: 'Substantial food and household provision',
    description: 'Staple food, groceries, snacks, drinks, and household provisions.',
    categories: ['snack_food', 'essential'],
    color: 'bg-navy/10 text-navy',
    accent: 'navy',
    minItems: 5,
    maxItems: 15,
  },
  {
    id: 'signal',
    name: 'SIGNAL',
    purpose: 'Communication support',
    description: 'Mobile phones, phone accessories, airtime, mobile data, and communication subscriptions where available.',
    categories: ['mobile_tech', 'airtime_data', 'subscriptions'],
    color: 'bg-champagne/10 text-champagne',
    accent: 'champagne',
    minItems: 1,
    maxItems: 6,
  },
  {
    id: 'solace',
    name: 'SOLACE',
    purpose: 'Broad personal care and comfort',
    description: 'Food, personal care, hygiene, comfort, and household essentials.',
    categories: ['comfort', 'body_care', 'snack_food', 'essential'],
    color: 'bg-brass/10 text-brass',
    accent: 'brass',
    minItems: 5,
    maxItems: 14,
  },
  {
    id: 'vanguard',
    name: 'VANGUARD',
    purpose: 'Comprehensive support',
    description: 'A comprehensive combination of currently available approved products tailored to the recipient, destination, and stated need.',
    categories: ['essential', 'comfort', 'body_care', 'snack_food', 'mobile_tech'],
    color: 'bg-navy/10 text-navy',
    accent: 'navy',
    minItems: 6,
    maxItems: 20,
  },
  {
    id: 'sovereign',
    name: 'SOVEREIGN',
    purpose: 'Highest-level curated support',
    description: 'The broadest appropriate combination of currently available approved products.',
    categories: ['essential', 'comfort', 'body_care', 'snack_food', 'mobile_tech', 'premium', 'executive'],
    color: 'bg-brass/10 text-brass',
    accent: 'brass',
    minItems: 8,
    maxItems: 25,
  },
];

/**
 * Build a dynamic package from the current verified catalog.
 * Package contents are determined at request time from available products.
 *
 * @param {Object} pkgDef - Package definition from HEROBOX_PACKAGES
 * @param {Array} products - Available HeroBoxProduct records
 * @param {Object} options - { destination, budget, recipientNeed }
 * @returns {Object} - { packageId, name, purpose, items, subtotal, itemCount, available, pricingTimestamp }
 */
export function buildPackage(pkgDef, products, options = {}) {
  const { destination, budget } = options;

  // Filter products by package categories
  let eligible = products.filter(
    (p) => pkgDef.categories.includes(p.category) &&
    p.status === 'active' &&
    p.availability === 'available' &&
    p.freshness_status !== 'stale' &&
    p.freshness_status !== 'expired'
  );

  // Destination-aware filtering
  if (destination) {
    eligible = eligible.filter(
      (p) => !p.destination || p.destination === '' || p.destination === destination
    );
  }

  // Sort by price ascending to maximize items within budget
  eligible.sort((a, b) => (a.price || 0) - (b.price || 0));

  let selected = [];
  let subtotal = 0;

  for (const product of eligible) {
    if (selected.length >= pkgDef.maxItems) break;
    const unitPrice = product.discount > 0
      ? product.price * (1 - product.discount / 100)
      : product.price;
    if (budget && subtotal + unitPrice > budget) continue;
    selected.push({
      product_id: product.id,
      name: product.name,
      category: product.category,
      price: unitPrice,
      original_price: product.price,
      discount: product.discount || 0,
      quantity: 1,
      source: product.source || '',
      freshness_status: product.freshness_status || 'current',
    });
    subtotal += unitPrice;
  }

  const available = selected.length >= pkgDef.minItems;

  return {
    packageId: pkgDef.id,
    name: pkgDef.name,
    purpose: pkgDef.purpose,
    description: pkgDef.description,
    color: pkgDef.color,
    accent: pkgDef.accent,
    items: selected,
    itemCount: selected.length,
    subtotal,
    shippingCost: available ? 15 : 0,
    total: available ? subtotal + 15 : 0,
    available,
    unavailableReason: !available ? 'Insufficient products in catalog for this package' : null,
    pricingTimestamp: new Date().toISOString(),
  };
}

/**
 * Build all packages from the current catalog.
 */
export function buildAllPackages(products, options = {}) {
  return HEROBOX_PACKAGES.map((pkgDef) => buildPackage(pkgDef, products, options));
}

/**
 * Get a package definition by ID.
 */
export function getPackageDefinition(packageId) {
  return HEROBOX_PACKAGES.find((p) => p.id === packageId);
}

/**
 * Check if a product is eligible for a given destination.
 */
export function isProductAvailableForDestination(product, destination) {
  if (!product.destination || product.destination === '') return true;
  return product.destination === destination;
}

/**
 * Determine freshness status based on last retrieval time.
 * @param {string} retrievedAt - ISO date string
 * @param {number} maxAgeHours - Maximum age in hours before stale
 */
export function computeFreshnessStatus(retrievedAt, maxAgeHours = 24) {
  if (!retrievedAt) return 'unavailable';
  const ageMs = Date.now() - new Date(retrievedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours > maxAgeHours * 3) return 'stale';
  if (ageHours > maxAgeHours) return 'recent';
  return 'current';
}

/**
 * Create an order snapshot that preserves exact purchased product state.
 * Later catalog changes must NOT alter historical orders.
 */
export function createOrderSnapshot(cartItems, packageData = null) {
  const snapshot = {
    snapshot_timestamp: new Date().toISOString(),
    items: cartItems.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      unit_price: item.price,
      original_price: item.original_price || item.price,
      discount: item.discount || 0,
      quantity: item.quantity,
      source: item.source || '',
      freshness_status: item.freshness_status || 'current',
    })),
  };
  if (packageData) {
    snapshot.package = {
      package_id: packageData.packageId,
      name: packageData.name,
      purpose: packageData.purpose,
      items: packageData.items,
      subtotal: packageData.subtotal,
    };
  }
  return snapshot;
}