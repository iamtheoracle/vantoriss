import React from 'react';
import { ShoppingCart, Package as PackageIcon, AlertCircle, Check, ArrowRight, Wifi, Heart, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

const PACKAGE_DETAILS = {
  hearth: 'A practical start with everyday essentials.',
  haven: 'Useful essentials with a little extra comfort.',
  vitalis: 'Personal care and hygiene for everyday wellbeing.',
  provision: 'Food and household supplies for the week ahead.',
  signal: 'A phone, data or internet support package to help someone stay connected.',
  solace: 'A thoughtful mix of comfort and personal-care items.',
  vanguard: 'A broader package for more substantial needs.',
  sovereign: 'A comprehensive package built from available approved items.',
  connect: 'Mobile connectivity, internet access and charging essentials.',
  family: 'Family-focused food, school and household essentials.',
  eldercare: 'Practical everyday care and comfort for older people.',
  resettlement: 'Household basics to help a family rebuild daily routines.',
};

export default function PackageShowcase({ packages, cart, onAddToCart }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#14243b] p-5 text-white">
        <div className="flex items-center gap-2 text-[#e4c88b] mb-2"><PackageIcon size={19} /><span className="text-[10px] uppercase tracking-widest font-bold">Curated support</span></div>
        <h2 className="text-xl font-bold mb-1">Packages for every kind of need.</h2>
        <p className="text-xs text-white/70 leading-relaxed">Choose a ready-made package or explore the items inside. Contents and totals are built from currently available catalogue records, not made-up stock.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#f7f3e9] p-3"><Heart size={17} className="text-brass mb-1" /><p className="text-xs font-bold text-foreground">Care & essentials</p><p className="text-[10px] text-gray">Food, hygiene and comfort</p></div>
        <div className="rounded-xl bg-[#eef3f8] p-3"><Wifi size={17} className="text-navy mb-1" /><p className="text-xs font-bold text-foreground">Phones & internet</p><p className="text-[10px] text-gray">Digital access and connectivity</p></div>
      </div>
      {packages.map(pkg => (
        <article key={pkg.packageId} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0"><span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wider mb-2 ${pkg.color}`}>{pkg.name}</span><h3 className="text-sm font-bold text-foreground">{pkg.purpose}</h3><p className="text-[11px] text-gray mt-1 leading-relaxed">{PACKAGE_DETAILS[pkg.packageId] || pkg.description}</p></div>
            <div className="text-right shrink-0">{pkg.available ? <><p className="text-base font-extrabold text-foreground">{formatCurrency(pkg.total)}</p><p className="text-[10px] text-gray">{pkg.itemCount} items</p></> : <span className="text-[10px] text-amber-700 font-semibold">Not yet available</span>}</div>
          </div>
          {pkg.available ? <>
            <div className="rounded-xl bg-slate-50 p-3 mb-3 space-y-2">
              {pkg.items.slice(0, 5).map((item, idx) => <div key={item.product_id || idx} className="flex items-center justify-between gap-2 text-[11px]"><span className="text-gray truncate">{item.name}</span><span className="font-semibold text-foreground shrink-0">{formatCurrency(item.price)}</span></div>)}
              {pkg.items.length > 5 && <p className="text-[10px] text-gray">Plus {pkg.items.length - 5} more items</p>}
            </div>
            <button onClick={() => pkg.items.forEach(item => onAddToCart({ id: item.product_id, ...item, price: item.original_price || item.price }))} className="w-full py-3 rounded-xl bg-navy text-white text-xs font-bold flex items-center justify-center gap-2"><ShoppingCart size={14} /> Add package to cart <ArrowRight size={14} /></button>
          </> : <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[10px] text-gray"><AlertCircle size={13} className="shrink-0 mt-0.5" /><span>{pkg.unavailableReason || 'This package needs more current catalogue items before it can be offered.'}</span></div>}
        </article>
      ))}
      <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3"><ShieldCheck size={14} className="text-brass shrink-0 mt-0.5" /><p className="text-[10px] text-gray">Packages are assembled from catalogue items. Final price, availability, delivery and recipient eligibility must be confirmed before payment.</p></div>
    </div>
  );
}
