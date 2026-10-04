import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plane } from 'lucide-react';
import ProviderUnavailableCard from '@/components/vantoris/ProviderUnavailableCard';

// Travel product — Spec §7.
// Shows a truthful unavailable state until a travel provider is connected.
// No fake flights, hotels, or flight tracking.
export default function Travel() {
  return (
    <div className="min-h-screen bg-background">
      <div className="vantoris-glass-header sticky top-0 z-10 px-5 py-4 safe-top">
        <div className="flex items-center gap-3 max-w-[430px] mx-auto">
          <Link to="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronLeft size={20} className="text-gray" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Travel</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-[430px] mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">Your travel, connected.</h2>
          <p className="text-sm text-gray">Flights, hotels, cars, and trips — all in one place.</p>
        </div>

        <ProviderUnavailableCard
          providerName="Travel booking"
          description="Flight, hotel, and car rental search will be available once a travel inventory provider is connected. No bookings will be simulated."
          icon={Plane}
        />

        <div className="mt-4 space-y-3">
          <div className="vantoris-card p-4">
            <p className="font-semibold text-sm mb-1">What you'll be able to do</p>
            <ul className="text-xs text-gray space-y-1.5 mt-2">
              <li>• Search and book round-trip, one-way, and multi-city flights</li>
              <li>• Find and reserve hotels, cars, and activities</li>
              <li>• Track real flight status from aviation data sources</li>
              <li>• Manage complete trip itineraries in one place</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}