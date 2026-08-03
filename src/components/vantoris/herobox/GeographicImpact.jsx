import React from 'react';
import { Globe, MapPin, Package, Users, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

const REGIONS = [
  { name: 'North America', x: 22, y: 38, communities: 12, packages: 340, sponsors: 89, active: true },
  { name: 'South America', x: 30, y: 62, communities: 8, packages: 156, sponsors: 34, active: true },
  { name: 'Europe', x: 50, y: 32, communities: 15, packages: 280, sponsors: 67, active: true },
  { name: 'Africa', x: 52, y: 56, communities: 22, packages: 410, sponsors: 45, active: true },
  { name: 'Middle East', x: 58, y: 44, communities: 9, packages: 198, sponsors: 28, active: true },
  { name: 'South Asia', x: 68, y: 48, communities: 18, packages: 367, sponsors: 52, active: true },
  { name: 'East Asia', x: 78, y: 38, communities: 11, packages: 234, sponsors: 41, active: true },
  { name: 'Oceania', x: 82, y: 68, communities: 6, packages: 89, sponsors: 19, active: false },
];

export default function GeographicImpact({ data }) {
  const totalCommunities = REGIONS.reduce((s, r) => s + r.communities, 0);
  const totalPackages = REGIONS.reduce((s, r) => s + r.packages, 0);
  const totalSponsors = REGIONS.reduce((s, r) => s + r.sponsors, 0);

  return (
    <div className="vantoris-glass-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-foreground font-bold text-base">Geographic Impact</h3>
          <p className="text-gray text-xs">Communities, missions & sponsor coverage worldwide</p>
        </div>
        <Globe size={16} className="text-gray" />
      </div>

      {/* Map visualization */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 mb-4" style={{ aspectRatio: '2.2/1' }}>
        {/* Stylized world map dots */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 50" preserveAspectRatio="none">
          {Array.from({ length: 200 }).map((_, i) => {
            const x = (i * 7.3) % 100;
            const y = (i * 3.7) % 50;
            return <circle key={i} cx={x} cy={y} r="0.4" fill="#071C38" />;
          })}
        </svg>

        {/* Region markers */}
        {REGIONS.map((region, idx) => (
          <motion.div
            key={region.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className="absolute group cursor-pointer"
            style={{ left: `${region.x}%`, top: `${region.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className={`relative ${region.active ? '' : 'opacity-40'}`}>
              {/* Pulse ring */}
              {region.active && (
                <span className="absolute inset-0 w-6 h-6 rounded-full bg-champagne/20 animate-ping" style={{ animationDuration: '2s' }} />
              )}
              <div className={`w-6 h-6 rounded-full ${region.active ? 'bg-champagne' : 'bg-gray'} flex items-center justify-center shadow-md relative z-10`}>
                <MapPin size={12} className="text-white" />
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
              <div className="vantoris-glass-dropdown p-2.5 text-xs whitespace-nowrap">
                <p className="text-foreground font-semibold mb-1">{region.name}</p>
                <div className="space-y-0.5">
                  <p className="text-gray">{region.communities} communities</p>
                  <p className="text-gray">{region.packages} packages</p>
                  <p className="text-gray">{region.sponsors} sponsors</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Region stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="vantoris-glass-flat p-3 text-center">
          <Users size={14} className="text-champagne mx-auto mb-1.5" />
          <p className="text-foreground font-bold text-lg">{totalCommunities}</p>
          <p className="text-gray text-[9px] uppercase tracking-wider font-semibold">Communities</p>
        </div>
        <div className="vantoris-glass-flat p-3 text-center">
          <Package size={14} className="text-mint mx-auto mb-1.5" />
          <p className="text-foreground font-bold text-lg">{totalPackages.toLocaleString()}</p>
          <p className="text-gray text-[9px] uppercase tracking-wider font-semibold">Packages</p>
        </div>
        <div className="vantoris-glass-flat p-3 text-center">
          <Wifi size={14} className="text-brass mx-auto mb-1.5" />
          <p className="text-foreground font-bold text-lg">{totalSponsors}</p>
          <p className="text-gray text-[9px] uppercase tracking-wider font-semibold">Sponsors</p>
        </div>
      </div>
    </div>
  );
}