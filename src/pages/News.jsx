import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Newspaper } from 'lucide-react';
import ProviderUnavailableCard from '@/components/vantoris/ProviderUnavailableCard';

// News product — Spec §16, §17.
// Shows a truthful unavailable state until a news provider is connected.
// No fabricated stories.
export default function News() {
  return (
    <div className="min-h-screen bg-background">
      <div className="vantoris-glass-header sticky top-0 z-10 px-5 py-4 safe-top">
        <div className="flex items-center gap-3 max-w-[430px] mx-auto">
          <Link to="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronLeft size={20} className="text-gray" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">News</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-[430px] mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">Your daily briefing.</h2>
          <p className="text-sm text-gray">Top stories, markets, and what matters to you.</p>
        </div>

        <ProviderUnavailableCard
          providerName="News feed"
          description="Daily briefings, personalized news, and alerts will be available once a news provider is connected. No stories will be fabricated."
          icon={Newspaper}
        />

        <div className="mt-4 space-y-3">
          <div className="vantoris-card p-4">
            <p className="font-semibold text-sm mb-1">What you'll be able to do</p>
            <ul className="text-xs text-gray space-y-1.5 mt-2">
              <li>• Read a personalized daily briefing</li>
              <li>• Follow countries, companies, markets, and topics</li>
              <li>• Get breaking news and market alerts</li>
              <li>• Access AI summaries and deep research (Premium)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}