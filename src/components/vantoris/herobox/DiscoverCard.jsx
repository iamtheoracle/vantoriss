import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Heart, ShoppingBag, Package, MapPin, Star, Shield, Stethoscope, Users, Utensils, AlertCircle, Building2 } from 'lucide-react';

const TYPE_ICONS = {
  medical_relief: Stethoscope,
  veteran_support: Shield,
  military_family_support: Users,
  deployed_support: Package,
  military_support: Shield,
  food_assistance: Utensils,
  emergency_relief: AlertCircle,
  disaster_response: AlertCircle,
  childrens_home: Users,
  orphanage: Users,
  shelter: Building2,
  humanitarian: Heart,
  ngo: Heart,
  charity: Heart,
  community: Users,
};

const CATEGORY_ICONS = {
  food: Utensils,
  essential_supplies: Package,
  surgery_medical: Stethoscope,
  children_support: Users,
  shelter: Building2,
  emergency: AlertCircle,
  military_support: Shield,
  disaster_relief: AlertCircle,
  financial_assistance: Heart,
  communication: Package,
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function DiscoverCard({ item, type, onShop, onDonate, index = 0 }) {
  const isOrg = type === 'organization';
  const isCase = type === 'case';
  const isNews = type === 'news';

  const iconKey = isOrg ? item.organization_type : isCase ? item.category : 'news';
  const Icon = isOrg
    ? TYPE_ICONS[item.organization_type] || Heart
    : isCase
    ? CATEGORY_ICONS[item.category] || Heart
    : Heart;

  const title = isOrg ? item.name : isCase ? item.case_title : isNews ? item.headline : '';
  const description = isOrg
    ? item.mission || item.description
    : isCase
    ? item.stated_need || item.requested_assistance
    : isNews
    ? item.summary
    : '';

  const location = item.location || '';
  const sourceUrl = item.source_url || item.website_url || '';
  const sourceName = item.source_name || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="vantoris-glass p-4 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {isOrg && item.logo_url ? (
          <img
            src={item.logo_url}
            alt={title}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-navy/8 border border-navy/10 flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-navy" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{title}</h4>
          {location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} className="text-gray/60 flex-shrink-0" />
              <span className="text-[11px] text-gray truncate">{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray leading-relaxed line-clamp-3 mb-3 flex-1">{description}</p>
      )}

      {/* Organization-specific: Charity Navigator rating */}
      {isOrg && (
        <div className="mb-3">
          {item.charity_navigator_rating && item.charity_navigator_rating !== 'Not rated by Charity Navigator' ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brass/10 border border-brass/15">
              <Star size={11} className="text-brass fill-brass" />
              <span className="text-[10px] font-semibold text-brass">{item.charity_navigator_rating}</span>
            </div>
          ) : (
            <span className="text-[10px] text-gray/60 italic">Not rated by Charity Navigator</span>
          )}
        </div>
      )}

      {/* Case-specific: estimated amount */}
      {isCase && item.estimated_amount > 0 && (
        <div className="mb-3">
          <span className="text-xs font-semibold text-foreground">
            ${item.estimated_amount.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray ml-1">estimated</span>
        </div>
      )}

      {/* Source link */}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-gray/70 hover:text-navy transition mb-3"
        >
          <ExternalLink size={10} />
          <span className="truncate">{sourceName || 'Source'}</span>
        </a>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100">
        {isOrg && (
          <>
            <a
              href={item.website_url || sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 rounded-lg bg-navy text-white text-[11px] font-semibold text-center hover:bg-navy/90 transition"
            >
              Learn more
            </a>
            <button
              onClick={onDonate}
              className="flex-1 py-2 rounded-lg bg-brass/10 border border-brass/20 text-brass text-[11px] font-semibold hover:bg-brass/20 transition"
            >
              Support
            </button>
          </>
        )}
        {isCase && (
          <>
            <button
              onClick={onShop}
              className="flex-1 py-2 rounded-lg bg-navy text-white text-[11px] font-semibold hover:bg-navy/90 transition"
            >
              Shop supplies
            </button>
            <button
              onClick={onDonate}
              className="flex-1 py-2 rounded-lg bg-brass/10 border border-brass/20 text-brass text-[11px] font-semibold hover:bg-brass/20 transition"
            >
              Donate
            </button>
          </>
        )}
        {isNews && sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 rounded-lg bg-navy text-white text-[11px] font-semibold text-center hover:bg-navy/90 transition"
          >
            Read article
          </a>
        )}
      </div>
    </motion.div>
  );
}