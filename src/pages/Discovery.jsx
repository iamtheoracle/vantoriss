import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DiscoverFeed from '@/components/vantoris/herobox/DiscoverFeed';
import { refreshDiscoveryNews } from '@/lib/discoveryWorker';

export default function Discovery() {
  const navigate = useNavigate();

  useEffect(() => {
    // Keep the intelligence store fresh while the member keeps Discovery open.
    const interval = window.setInterval(() => {
      refreshDiscoveryNews().catch(() => {});
    }, 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="px-5 pt-6 pb-28 max-w-[430px] mx-auto">
      <DiscoverFeed
        standalone
        onShop={() => navigate('/herobox')}
        onDonate={() => navigate('/herobox')}
      />
    </div>
  );
}
