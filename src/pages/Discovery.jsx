import React from 'react';
import { useNavigate } from 'react-router-dom';
import DiscoverFeed from '@/components/vantoris/herobox/DiscoverFeed';

export default function Discovery() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-6 pb-28 max-w-[430px] mx-auto">
      <header className="mb-5">
        <p className="text-gray text-sm">Vantoris Intelligence</p>
        <h1 className="text-3xl font-bold mt-1 tracking-tight">Discovery</h1>
        <p className="text-gray text-sm mt-1">Verified opportunities, needs and humanitarian intelligence.</p>
      </header>

      <DiscoverFeed
        standalone
        onShop={() => navigate('/herobox')}
        onDonate={() => navigate('/herobox')}
      />
    </div>
  );
}
