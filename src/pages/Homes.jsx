import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Home as HomeIcon } from 'lucide-react';
import ProviderUnavailableCard from '@/components/vantoris/ProviderUnavailableCard';

// Homes product — Spec §8.
// Shows a truthful unavailable state until a property/listing provider is connected.
// No fabricated listings.
export default function Homes() {
  return (
    <div className="min-h-screen bg-background">
      <div className="vantoris-glass-header sticky top-0 z-10 px-5 py-4 safe-top">
        <div className="flex items-center gap-3 max-w-[430px] mx-auto">
          <Link to="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronLeft size={20} className="text-gray" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Homes</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-[430px] mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">Find your next place.</h2>
          <p className="text-sm text-gray">Search, save, and explore properties.</p>
        </div>

        <ProviderUnavailableCard
          providerName="Property search"
          description="Property listings, search, and saved homes will be available once a licensed listing provider is connected. No listings will be fabricated."
          icon={HomeIcon}
        />

        <div className="mt-4 space-y-3">
          <div className="vantoris-card p-4">
            <p className="font-semibold text-sm mb-1">What you'll be able to do</p>
            <ul className="text-xs text-gray space-y-1.5 mt-2">
              <li>• Search by address, city, neighborhood, or ZIP</li>
              <li>• Filter by price, beds, baths, and property type</li>
              <li>• Save homes and set price alerts</li>
              <li>• View property details, photos, and neighborhood info</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}