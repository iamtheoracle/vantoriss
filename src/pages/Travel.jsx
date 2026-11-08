import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble, CarFront, ChevronLeft, FileText, MapPin, MessageCircle,
  Plane, Radio, ShieldCheck, Plus, Trash2, ExternalLink, CalendarDays,
} from 'lucide-react';
import { hasCapability } from '@/lib/providers/registry';

const STORAGE_KEY = 'avcu-travel-planner-v1';
const travelServices = [
  { title: 'Flights', capability: 'flight_search', description: 'Compare one-way, return and multi-city journeys.', detail: 'Live fares and ticketing require a verified flight provider.', icon: Plane },
  { title: 'Places to stay', capability: 'stay_search', description: 'Plan accommodation by destination, dates and guest needs.', detail: 'Live room availability and reservations require a verified provider.', icon: BedDouble },
  { title: 'Car hire', capability: 'car_search', description: 'Plan pickup, return, vehicle class and rental requirements.', detail: 'Live vehicle availability and reservations require a verified provider.', icon: CarFront },
  { title: 'Flight updates', capability: 'flight_status', description: 'Keep flight numbers and travel dates ready for status checks.', detail: 'Live operational updates require a verified aviation data source.', icon: Radio },
];

const emptyTrip = { destination: '', startDate: '', endDate: '', notes: '', items: [] };

export default function Travel() {
  const [trip, setTrip] = useState(emptyTrip);
  const [itemType, setItemType] = useState('Flight');
  const [itemTitle, setItemTitle] = useState('');
  const [itemDate, setItemDate] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const connectedCount = travelServices.filter(service => hasCapability('travel', service.capability)).length;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setTrip({ ...emptyTrip, ...JSON.parse(stored), items: JSON.parse(stored).items || [] });
    } catch {
      setSaved(false);
    }
  }, []);

  function updateTrip(field, value) {
    setTrip(current => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function saveTrip() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  function addItem(event) {
    event.preventDefault();
    if (!itemTitle.trim()) return;
    setTrip(current => ({
      ...current,
      items: [...current.items, { id: crypto.randomUUID(), type: itemType, title: itemTitle.trim(), date: itemDate, notes: itemNotes.trim() }],
    }));
    setItemTitle('');
    setItemDate('');
    setItemNotes('');
    setSaved(false);
  }

  function removeItem(id) {
    setTrip(current => ({ ...current, items: current.items.filter(item => item.id !== id) }));
    setSaved(false);
  }

  function exportTrip() {
    const lines = [
      'AVCU TRAVEL PLAN',
      `Destination: ${trip.destination || 'Not set'}`,
      `Dates: ${trip.startDate || 'Not set'} to ${trip.endDate || 'Not set'}`,
      `Notes: ${trip.notes || 'None'}`,
      '',
      ...trip.items.map(item => `[${item.type}] ${item.date || 'Date not set'} — ${item.title}${item.notes ? ` | ${item.notes}` : ''}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'avcu-travel-plan.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const mapQuery = encodeURIComponent(trip.destination || 'destination');
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

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
              <MapPin size={13} /> TRAVEL WITH ATCHISON VILLAGE
            </div>
            <h2 className="mt-5 text-3xl md:text-4xl font-semibold leading-tight">Your next journey starts here.</h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-white/75 max-w-xl">
              Plan your trip, organise your details and keep an itinerary even when live travel providers are unavailable.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#D9C49A]/40 bg-white/10 px-4 py-3 text-sm">
              <ShieldCheck size={17} className="text-[#E2C994]" />
              <span>{connectedCount} of {travelServices.length} live travel capabilities connected</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="travel-services-heading">
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#8B7650]">Travel services</p>
            <h3 id="travel-services-heading" className="text-xl font-semibold text-foreground mt-1">Live services and manual alternatives</h3>
            <p className="mt-1 text-sm text-gray">Manual planning works without supplier APIs. Live prices, inventory and confirmations do not.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {travelServices.map(service => {
              const Icon = service.icon;
              const connected = hasCapability('travel', service.capability);
              return (
                <article key={service.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#173D32]/10 flex items-center justify-center"><Icon size={20} className="text-[#173D32]" /></div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{connected ? 'Live provider ready' : 'Manual mode available'}</span>
                  </div>
                  <h4 className="mt-4 text-base font-semibold text-foreground">{service.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray">{service.description}</p>
                  <p className="mt-3 border-t border-border pt-3 text-xs text-gray">{connected ? 'Provider capability is enabled; each request must still be verified.' : service.detail}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="trip-planner" className="rounded-2xl border border-border bg-white p-5 md:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#8B7650]">Works without supplier APIs</p>
              <h3 className="mt-1 text-xl font-semibold text-foreground">My trip planner</h3>
              <p className="mt-1 text-sm text-gray">Create a personal itinerary manually and keep it on this device.</p>
            </div>
            <CalendarDays className="text-[#8B7650]" size={22} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs font-medium text-gray">Destination
              <input value={trip.destination} onChange={e => updateTrip('destination', e.target.value)} placeholder="City or destination" className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm text-foreground" />
            </label>
            <label className="text-xs font-medium text-gray">Start date
              <input type="date" value={trip.startDate} onChange={e => updateTrip('startDate', e.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm text-foreground" />
            </label>
            <label className="text-xs font-medium text-gray">End date
              <input type="date" value={trip.endDate} min={trip.startDate || undefined} onChange={e => updateTrip('endDate', e.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm text-foreground" />
            </label>
          </div>
          <label className="block text-xs font-medium text-gray">Trip notes
            <textarea value={trip.notes} onChange={e => updateTrip('notes', e.target.value)} rows={2} placeholder="Purpose of trip, reminders and general notes (do not enter passport or payment details)" className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm text-foreground" />
          </label>

          <form onSubmit={addItem} className="rounded-xl bg-[#FBF9F3] p-4 space-y-3">
            <h4 className="text-sm font-semibold text-[#173D32]">Add an itinerary item</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs font-medium text-gray">Type
                <select value={itemType} onChange={e => setItemType(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground">
                  <option>Flight</option><option>Hotel</option><option>Car hire</option><option>Activity</option><option>Meeting</option><option>Other</option>
                </select>
              </label>
              <label className="text-xs font-medium text-gray sm:col-span-2">Title or reference
                <input value={itemTitle} onChange={e => setItemTitle(e.target.value)} required placeholder="e.g. Flight to Abuja, hotel check-in" className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground" />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs font-medium text-gray">Date
                <input type="date" value={itemDate} onChange={e => setItemDate(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground" />
              </label>
              <label className="text-xs font-medium text-gray">Notes
                <input value={itemNotes} onChange={e => setItemNotes(e.target.value)} placeholder="Confirmation reference or reminder" className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground" />
              </label>
            </div>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#173D32] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> Add to itinerary</button>
          </form>

          <div className="space-y-2">
            <div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-foreground">Itinerary ({trip.items.length})</h4><span className="text-xs text-gray">Manual entries</span></div>
            {trip.items.length === 0 ? <p className="rounded-xl border border-dashed border-border p-4 text-sm text-gray">Your itinerary is empty. Add flights, stays, transport or activities above.</p> : trip.items.map(item => (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[#8B7650]">{item.type} · {item.date || 'Date not set'}</p><p className="mt-1 text-sm font-medium text-foreground">{item.title}</p>{item.notes && <p className="mt-1 text-xs text-gray">{item.notes}</p>}</div>
                <button type="button" onClick={() => removeItem(item.id)} aria-label="Remove itinerary item" className="rounded-lg p-2 text-gray hover:bg-slate-100"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <button type="button" onClick={saveTrip} className="rounded-lg bg-[#173D32] px-4 py-2.5 text-sm font-semibold text-white">Save on this device</button>
            <button type="button" onClick={exportTrip} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground">Export itinerary</button>
            <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground"><MapPin size={15} /> Open destination map <ExternalLink size={13} /></a>
          </div>
          <p role="status" className="text-xs text-gray">{saved ? 'Trip saved in this browser on this device.' : 'Save stores this itinerary in this browser only. It does not sync to another device or create a supplier booking.'}</p>
        </section>

        <section className="rounded-2xl border border-[#D9CBAF] bg-[#FBF9F3] p-5 md:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#8B7650]" />
            <div>
              <h3 className="font-semibold text-[#173D32]">No false confirmations</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#68766F]">Manual entries are your own notes, not supplier bookings. Prices, availability, tickets, reservations, flight status, payments and refunds are only marked verified after a real provider or authorised operator confirms them.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="travel-help-heading" className="rounded-2xl border border-border bg-white p-5 md:p-6">
          <h3 id="travel-help-heading" className="text-base font-semibold text-foreground">Member support</h3>
          <p className="mt-1 text-sm text-gray">Ask the member team for help with a travel arrangement while live integrations are being completed.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/documents" className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-slate-50 transition-colors"><FileText size={18} className="text-[#8B7650]" /><span className="flex-1 text-sm font-medium text-foreground">Member documents</span><span className="text-xs text-gray">Open</span></Link>
            <Link to="/messages" className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-slate-50 transition-colors"><MessageCircle size={18} className="text-[#8B7650]" /><span className="flex-1 text-sm font-medium text-foreground">Contact member support</span><span className="text-xs text-gray">Open</span></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
