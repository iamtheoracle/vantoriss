import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plane, Home as HomeIcon, Heart, Newspaper, Bell, ChevronRight, Wallet } from 'lucide-react';
import { isProviderConnected } from '@/lib/providers/registry';
import ProviderUnavailableCard from '@/components/vantoris/ProviderUnavailableCard';

// Personalized dashboard modules — Spec §4.
// Each module shows real state or a truthful unavailable state.
// No fabricated activity, transactions, trips, or listings.
export default function DashboardModules({ accounts, cards, portfolios }) {
  const navigate = useNavigate();

  const hasAccounts = accounts.length > 0;
  const hasCards = cards.length > 0;
  const hasWealth = portfolios.length > 0;

  return (
    <div className="space-y-4">
      {/* Recent transactions — only if accounts exist */}
      {hasAccounts && (
        <button
          onClick={() => navigate('/accounts')}
          className="w-full text-left vantoris-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-brass" />
              <span className="font-semibold text-sm">Recent activity</span>
            </div>
            <ChevronRight size={16} className="text-gray/40" />
          </div>
          <p className="text-xs text-gray">View your latest transactions and payments.</p>
        </button>
      )}

      {/* Cards — real cards or truthful unavailable */}
      {hasCards ? (
        <button
          onClick={() => navigate('/cards')}
          className="w-full text-left vantoris-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-brass" />
              <span className="font-semibold text-sm">Cards</span>
            </div>
            <ChevronRight size={16} className="text-gray/40" />
          </div>
          <p className="text-xs text-gray">{cards.length} card{cards.length === 1 ? '' : 's'} active</p>
        </button>
      ) : (
        <ProviderUnavailableCard
          providerName="Cards"
          description="Card management is not yet available. Request a card to get started."
          icon={CreditCard}
          actionLabel="View card services"
          actionRoute="/cards"
          compact
        />
      )}

      {/* Travel — truthful unavailable */}
      {!isProviderConnected('travel') && (
        <ProviderUnavailableCard
          providerName="Travel"
          description="Flights, hotels, and car rentals will appear here once a travel provider is connected."
          icon={Plane}
          actionLabel="Explore Travel"
          actionRoute="/travel"
          compact
        />
      )}

      {/* Homes — truthful unavailable */}
      {!isProviderConnected('homes') && (
        <ProviderUnavailableCard
          providerName="Homes"
          description="Property search and saved homes will appear here once a listing provider is connected."
          icon={HomeIcon}
          actionLabel="Explore Homes"
          actionRoute="/homes"
          compact
        />
      )}

      {/* HeroBox orders — only if marketplace connected */}
      {isProviderConnected('marketplace') && (
        <button
          onClick={() => navigate('/herobox')}
          className="w-full text-left vantoris-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-brass" />
              <span className="font-semibold text-sm">HeroBox</span>
            </div>
            <ChevronRight size={16} className="text-gray/40" />
          </div>
          <p className="text-xs text-gray">Send, give, connect, and serve.</p>
        </button>
      )}

      {/* News — truthful unavailable */}
      {!isProviderConnected('news') && (
        <ProviderUnavailableCard
          providerName="News"
          description="Daily briefings and personalized news will appear here once a news provider is connected."
          icon={Newspaper}
          actionLabel="Explore News"
          actionRoute="/news"
          compact
        />
      )}

      {/* Notifications — only if connected */}
      {isProviderConnected('notifications') && (
        <button
          onClick={() => navigate('/messages')}
          className="w-full text-left vantoris-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-brass" />
              <span className="font-semibold text-sm">Notifications</span>
            </div>
            <ChevronRight size={16} className="text-gray/40" />
          </div>
          <p className="text-xs text-gray">Important updates and alerts.</p>
        </button>
      )}
    </div>
  );
}