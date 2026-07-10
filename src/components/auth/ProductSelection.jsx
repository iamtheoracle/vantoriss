import React from "react";
import { motion } from "framer-motion";
import { User, Users, Building2, KeyRound, Landmark, TrendingUp, Briefcase, Wallet, Check, ArrowLeft } from "lucide-react";

export const PRODUCTS = [
  { id: "personal", label: "Personal Banking", accountType: "Personal", icon: User, desc: "Everyday checking, savings, and debit card access" },
  { id: "joint", label: "Joint Account", accountType: "Joint", icon: Users, desc: "Shared account access for partners or family" },
  { id: "business", label: "Business Banking", accountType: "Business", icon: Building2, desc: "Operating accounts and treasury services" },
  { id: "private", label: "Private Banking", accountType: "Personal", icon: KeyRound, desc: "Dedicated relationship management and bespoke services" },
  { id: "institutional", label: "Institutional", accountType: "Organization", icon: Landmark, desc: "Custodial and administrative services for funds" },
  { id: "investment", label: "Investment Account", accountType: "Personal", icon: TrendingUp, desc: "Self-directed trading and portfolio management" },
  { id: "commercial", label: "Commercial Banking", accountType: "Business", icon: Briefcase, desc: "Lending, treasury, and cash management solutions" },
  { id: "wealth", label: "Wealth Management", accountType: "Personal", icon: Wallet, desc: "Investment advisory and estate planning services" },
];

export default function ProductSelection({ selected, onSelect, onBack }) {
  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray mb-6 hover:text-foreground transition">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      )}
      <h2 className="text-lg font-semibold text-foreground mb-1">Select Your Account Type</h2>
      <p className="text-gray text-sm mb-6">Choose the account that best fits your financial needs.</p>
      <div className="grid grid-cols-2 gap-3">
        {PRODUCTS.map((product, idx) => {
          const Icon = product.icon;
          const isSelected = selected?.id === product.id;
          return (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(product)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? "border-navy bg-navy/5 shadow-md"
                  : "border-slate-200 bg-white hover:border-navy/30 hover:bg-slate-50"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-navy flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                isSelected ? "bg-navy text-white" : "bg-slate-100 text-navy"
              }`}>
                <Icon size={20} />
              </div>
              <p className="text-sm font-semibold text-foreground leading-tight">{product.label}</p>
              <p className="text-[11px] text-gray mt-1 leading-snug">{product.desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}