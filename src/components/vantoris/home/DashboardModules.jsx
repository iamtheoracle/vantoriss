import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Home as HomeIcon, Heart, Newspaper, Bell, ChevronRight, Wallet } from 'lucide-react';
import { isProviderConnected } from '@/lib/providers/registry';
import ProviderUnavailableCard from '@/components/vantoris/ProviderUnavailableCard';

// Member dashboard modules show verified member data or a clear provider-readiness state.
export default function DashboardModules({ accounts = [] }) {
  const navigate = useNavigate();
  const hasAccounts = accounts.length > 0;

  return (
    <div className="space-y-4">
      {hasAccounts && (
        <button onClick={() => navigate('/accounts')} className="w-full text-left rounded-2xl border border-[#E5DDCA] bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-[#C5A66A]" />
              <span className="font-semibold text-sm text-[#173D32]">Recent activity</span>
            </div>
            <ChevronRight size={16} className="text-[#68766F]/50" />
          </div>
          <p className="text-xs text-[#68766F]">View your latest transactions and payments.</p>
        </button>
      )}

      {!isProviderConnected('travel') && (
        <ProviderUnavailableCard providerName="Travel" description="Flights, hotels, and car rentals will appear here once a travel provider is connected." icon={Plane} actionLabel="Explore Travel" actionRoute="/travel" compact />
      )}

      {!isProviderConnected('homes') && (
        <ProviderUnavailableCard providerName="Homes" description="Property search and saved homes will appear here once a listing provider is connected." icon={HomeIcon} actionLabel="Explore Homes" actionRoute="/homes" compact />
      )}

      {isProviderConnected('marketplace') && (
        <button onClick={() => navigate('/herobox')} className="w-full text-left rounded-2xl border border-[#E5DDCA] bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-[#C5A66A]" />
              <span className="font-semibold text-sm text-[#173D32]">HeroBox</span>
            </div>
            <ChevronRight size={16} className="text-[#68766F]/50" />
          </div>
          <p className="text-xs text-[#68766F]">Send, give, connect, and serve.</p>
        </button>
      )}

      {!isProviderConnected('news') && (
        <ProviderUnavailableCard providerName="News" description="Daily briefings and personalized news will appear here once a news provider is connected." icon={Newspaper} actionLabel="Explore News" actionRoute="/news" compact />
      )}

      {isProviderConnected('notifications') && (
        <button onClick={() => navigate('/messages')} className="w-full text-left rounded-2xl border border-[#E5DDCA] bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[#C5A66A]" />
              <span className="font-semibold text-sm text-[#173D32]">Notifications</span>
            </div>
            <ChevronRight size={16} className="text-[#68766F]/50" />
          </div>
          <p className="text-xs text-[#68766F]">Important updates and alerts.</p>
        </button>
      )}
    </div>
  );
}
