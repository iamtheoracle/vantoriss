import React from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  CarFront,
  ChevronLeft,
  FileText,
  MapPin,
  MessageCircle,
  Plane,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import { hasCapability } from '@/lib/providers/registry';

const travelServices = [
  { title: 'Flights', capability: 'flight_search', description: 'Compare one-way, return and multi-city journeys with clear fare conditions.', detail: 'Flight inventory and ticketing are not connected.', icon: Plane },
  { title: 'Places to stay', capability: 'stay_search', description: 'Search accommodation by destination, dates, guests and room requirements.', detail: 'Accommodation inventory and reservations are not connected.', icon: BedDouble },
  { title: 'Car hire', capability: 'car_search', description: 'Compare vehicle options, pickup locations, rental terms and total costs.', detail: 'Car rental inventory and reservations are not connected.', icon: CarFront },
  { title: 'Flight updates', capability: 'flight_status', description: 'Follow verified departure, arrival, gate and delay information.', detail: 'Live aviation status data is not connected.', icon: Radio },
];

export default function Travel() {
  const connectedCount = travelServices.filter(service => hasCapability('travel', service.capability)).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="vantoris-glass-header sticky top-0 z-10 px-5 py-4 safe-top">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <Link to="/" aria-label="Back to home" className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronLeft size={20} className="text-gray" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Travel</h1>
        </div>
      </div>

      <main className="px-5 py-7 md:py-10 max-w-6xl mx-auto space-y-7">
        <section className="relative overflow-hidden rounded-3xl bg-[#173D32] text-white p-6 md:p-9">
          <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full border border-white/10" />
          <div className="absolute -right-5 -top-12 w-52 h-52 rounded-full border border-white/10" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide">
              <MapPin size={13} />
              TRAVEL WITH ATCHISON VILLAGE
            </div>
            <h2 className="mt-5 text-3xl md:text-4xl font-semibold leading-tight">Your next journey starts here.</h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-white/75 max-w-xl">
              A single place to plan flights, stays and ground transport, then keep your trip details together.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#D9C49A]/40 bg-white/10 px-4 py-3 text-sm">
              <ShieldCheck size={17} className="text-[#E2C994]" />
              <span>{connectedCount} of {travelServices.length} travel services connected</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="travel-services-heading">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#8B7650]">Explore services</p>
              <h3 id="travel-services-heading" className="text-xl font-semibold text-foreground mt-1">Everything for the journey</h3>
            </div>
            <p className="text-xs text-gray">Availability will appear when each service is verified.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {travelServices.map(service => {
              const Icon = service.icon;
              const connected = hasCapability('travel', service.capability);
              return (
                <article key={service.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#173D32]/10 flex items-center justify-center">
                      <Icon size={20} className="text-[#173D32]" />
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      {connected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  <h4 className="mt-4 text-base font-semibold text-foreground">{service.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray">{service.description}</p>
                  <p className="mt-4 border-t border-border pt-3 text-xs text-gray">
                    {connected ? 'Provider capability is enabled. Live results are subject to a verified request.' : service.detail}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#D9CBAF] bg-[#FBF9F3] p-5 md:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#8B7650]" />
            <div>
              <h3 className="font-semibold text-[#173D32]">A clear and reliable booking experience</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#68766F]">
                Search results, prices, availability and booking confirmations will only be shown after they are received from a verified travel provider. No sample itineraries, estimated inventory or simulated bookings are presented as real.
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/80 p-3">
              <p className="text-xs font-semibold text-[#173D32]">Before payment</p>
              <p className="mt-1 text-xs leading-relaxed text-[#68766F]">Show supplier, currency, total price and restrictions.</p>
            </div>
            <div className="rounded-xl bg-white/80 p-3">
              <p className="text-xs font-semibold text-[#173D32]">After booking</p>
              <p className="mt-1 text-xs leading-relaxed text-[#68766F]">Save the supplier confirmation and itinerary reference.</p>
            </div>
            <div className="rounded-xl bg-white/80 p-3">
              <p className="text-xs font-semibold text-[#173D32]">When plans change</p>
              <p className="mt-1 text-xs leading-relaxed text-[#68766F]">Track cancellations, changes and refunds against supplier status.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="travel-help-heading" className="rounded-2xl border border-border bg-white p-5 md:p-6">
          <h3 id="travel-help-heading" className="text-base font-semibold text-foreground">Get ready for your trip</h3>
          <p className="mt-1 text-sm text-gray">Your existing member services remain available while travel connections are being prepared.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/documents" className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-slate-50 transition-colors">
              <FileText size={18} className="text-[#8B7650]" />
              <span className="flex-1 text-sm font-medium text-foreground">Member documents</span>
              <span className="text-xs text-gray">Open</span>
            </Link>
            <Link to="/messages" className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-slate-50 transition-colors">
              <MessageCircle size={18} className="text-[#8B7650]" />
              <span className="flex-1 text-sm font-medium text-foreground">Contact member support</span>
              <span className="text-xs text-gray">Open</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
