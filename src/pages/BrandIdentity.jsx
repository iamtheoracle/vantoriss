import React, { useState } from 'react';
import { motion } from 'framer-motion';
import VantorisMonogram from '@/components/vantoris/brand/VantorisMonogram';
import VantorisLogo from '@/components/vantoris/brand/VantorisLogo';
import VantorisSeal from '@/components/vantoris/brand/VantorisSeal';
import VantorisAppIcon from '@/components/vantoris/brand/VantorisAppIcon';

const PALETTE = [
  { name: 'Forest Green', hex: '#173D32', role: 'Primary', text: '#F7F4EC' },
  { name: 'Deep Forest', hex: '#102C25', role: 'Secondary', text: '#F7F4EC' },
  { name: 'Moss Green', hex: '#376B5A', role: 'Accent', text: '#F7F4EC' },
  { name: 'Champagne Gold', hex: '#C5A66A', role: 'Metal', text: '#102C25' },
  { name: 'Brushed Gold', hex: '#B5945A', role: 'Metal', text: '#102C25' },
  { name: 'Warm Cream', hex: '#F7F4EC', role: 'Neutral', text: '#102C25' },
  { name: 'Stone Gray', hex: '#68766F', role: 'Neutral', text: '#F7F4EC' },
];

const VARIANTS = ['flat', 'metallic', 'glass', 'monochrome', 'outline', 'foil', 'embossed'];

function Section({ title, subtitle, dark, children }) {
  return (
    <section className={`rounded-3xl p-6 sm:p-10 ${dark ? 'bg-[#102C25]' : 'bg-white border border-slate-200'}`}>
      <div className="mb-8">
        <p className={`text-[10px] uppercase tracking-[0.3em] font-semibold mb-2 ${dark ? 'text-[#C5A66A]' : 'text-[#173D32]'}`}>
          {subtitle}
        </p>
        <h2 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-[#102C25]'}`}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Card({ children, className = '', dark }) {
  return (
    <div className={`rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all ${dark ? 'bg-white/[0.04] border border-white/10' : 'bg-slate-50 border border-slate-200'} ${className}`}>
      {children}
    </div>
  );
}

export default function BrandIdentity() {
  const [selectedVariant, setSelectedVariant] = useState('metallic');

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className="max-w-6xl mx-auto px-5 py-10 sm:py-16 space-y-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-[#102C25] p-10 sm:p-16 text-center"
        >
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(46,91,255,0.4) 0%, transparent 60%)' }} />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <VantorisLogo layout="vertical" size={88} variant="metallic" theme="dark" showTagline />
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              A timeless brand identity for a world-class private financial institution —
              engineered with precision, restraint, and institutional confidence.
            </p>
          </div>
        </motion.div>

        {/* Primary Logo */}
        <Section title="Primary Logo" subtitle="01 — Core Identity" dark>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card dark>
              <VantorisLogo layout="horizontal" size={44} variant="metallic" theme="dark" showTagline />
              <span className="text-white/40 text-xs">Horizontal · Metallic · Dark</span>
            </Card>
            <Card dark>
              <VantorisLogo layout="horizontal" size={44} variant="flat" theme="dark" />
              <span className="text-white/40 text-xs">Horizontal · Flat · Dark</span>
            </Card>
          </div>
        </Section>

        {/* Monogram Variants */}
        <Section title="The Monogram" subtitle="02 — Custom Geometric V">
          <p className="text-slate-500 text-sm mb-6 max-w-2xl">
            A custom "V" constructed from two engineered strokes converging at a precise apex —
            communicating strength, stability, growth, security, and legacy without ornament.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {VARIANTS.map((v) => (
              <Card key={v} dark={v === 'glass' || v === 'metallic' || v === 'foil' || v === 'embossed'}>
                <VantorisMonogram size={56} variant={v} theme={v === 'glass' || v === 'metallic' || v === 'foil' || v === 'embossed' ? 'dark' : 'light'} />
                <span className={`text-xs capitalize ${v === 'glass' || v === 'metallic' || v === 'foil' || v === 'embossed' ? 'text-white/40' : 'text-slate-400'}`}>{v}</span>
              </Card>
            ))}
          </div>

          {/* Interactive viewer */}
          <div className="rounded-2xl bg-[#102C25] p-8 flex flex-col items-center gap-5">
            <VantorisMonogram size={120} variant={selectedVariant} theme="dark" />
            <div className="flex flex-wrap justify-center gap-2">
              {VARIANTS.map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    selectedVariant === v ? 'bg-[#C5A66A] text-[#102C25]' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Logo Lockups */}
        <Section title="Logo System" subtitle="03 — Lockups & Treatments">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <VantorisLogo layout="horizontal" size={40} variant="flat" theme="light" />
              <span className="text-slate-400 text-xs">Horizontal · Light</span>
            </Card>
            <Card dark>
              <VantorisLogo layout="horizontal" size={40} variant="flat" theme="dark" />
              <span className="text-white/40 text-xs">Horizontal · Dark</span>
            </Card>
            <Card>
              <VantorisLogo layout="vertical" size={48} variant="metallic" theme="light" showTagline />
              <span className="text-slate-400 text-xs">Vertical · With Tagline</span>
            </Card>
            <Card dark>
              <VantorisLogo layout="vertical" size={48} variant="metallic" theme="dark" showTagline />
              <span className="text-white/40 text-xs">Vertical · Dark</span>
            </Card>
            <Card>
              <VantorisMonogram size={64} variant="flat" theme="light" />
              <span className="text-slate-400 text-xs">Standalone Monogram</span>
            </Card>
            <Card dark className="relative overflow-hidden">
              <VantorisLogo layout="watermark" size={80} variant="metallic" theme="dark" className="absolute inset-0 flex items-center justify-center" />
              <VantorisMonogram size={64} variant="glass" theme="dark" />
              <span className="text-white/40 text-xs relative z-10">Watermark + Glass</span>
            </Card>
          </div>
        </Section>

        {/* App Icon */}
        <Section title="App Icon" subtitle="04 — Mobile & Desktop">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[32, 48, 72, 120].map((s) => (
              <Card key={s}>
                <VantorisAppIcon size={s} />
                <span className="text-slate-400 text-xs">{s}px</span>
              </Card>
            ))}
          </div>
        </Section>

        {/* Executive Seal */}
        <Section title="Executive Seal" subtitle="05 — Institutional Mark">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <VantorisSeal size={180} theme="light" />
              <span className="text-slate-400 text-xs">Light Seal</span>
            </Card>
            <Card dark>
              <VantorisSeal size={180} theme="dark" />
              <span className="text-white/40 text-xs">Dark Seal</span>
            </Card>
          </div>
        </Section>

        {/* Color Palette */}
        <Section title="Color Palette" subtitle="06 — Institutional Spectrum">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PALETTE.map((c) => (
              <div key={c.name} className="rounded-2xl overflow-hidden border border-slate-200">
                <div className="h-24 flex items-end p-3" style={{ background: c.hex }}>
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: c.text }}>{c.role}</span>
                </div>
                <div className="p-3 bg-white">
                  <p className="text-sm font-semibold text-[#102C25]">{c.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography" subtitle="07 — Geometric · Legible · Premium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <p className="text-[#102C25] font-heading" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '0.24em' }}>ATCHISON VILLAGE</p>
              <p className="text-slate-400 text-xs">Inter · 800 · 0.24em tracking · Heading</p>
            </Card>
            <Card>
              <p className="text-[#102C25] font-body" style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.6 }}>
                The quick brown fox jumps over the lazy dog. 0123456789 — Institutional clarity for executive correspondence and member-facing communications.
              </p>
              <p className="text-slate-400 text-xs">Inter · 400 · Body</p>
            </Card>
          </div>
        </Section>

        {/* Applications */}
        <Section title="Brand Applications" subtitle="08 — Across Touchpoints" dark>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Debit Card */}
            <div className="relative rounded-2xl p-5 h-44 overflow-hidden" style={{ background: 'linear-gradient(135deg, #102C25 0%, #173D32 100%)' }}>
              <div className="flex justify-between items-start">
                <VantorisMonogram size={32} variant="metallic" theme="dark" />
                <div className="w-9 h-7 rounded-md" style={{ background: 'linear-gradient(135deg, #B5945A, #C5A66A)' }} />
              </div>
              <p className="text-white/80 font-mono text-[11px] mt-8 tracking-widest">•••• •••• •••• ••••</p>
              <p className="text-white/50 text-[9px] uppercase tracking-widest mt-2">MEMBER · DEBIT</p>
              <div className="absolute bottom-3 right-4">
                <VantorisLogo layout="horizontal" size={16} variant="flat" theme="dark" />
              </div>
            </div>

            {/* Statement Header */}
            <div className="rounded-2xl bg-white p-5 h-44 border border-slate-200">
              <VantorisLogo layout="horizontal" size={22} variant="flat" theme="light" showTagline />
              <div className="mt-4 h-px bg-slate-200" />
              <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-3">Quarterly Statement</p>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 bg-slate-100 rounded w-full" />
                <div className="h-1.5 bg-slate-100 rounded w-4/5" />
                <div className="h-1.5 bg-slate-100 rounded w-3/5" />
              </div>
            </div>

            {/* Business Card */}
            <div className="rounded-2xl bg-white p-5 h-44 border border-slate-200 flex flex-col justify-between">
              <VantorisMonogram size={28} variant="metallic" theme="light" />
              <div>
                <p className="text-[#102C25] font-semibold text-sm">Member Name</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest">Member Services</p>
                <p className="text-slate-400 text-[10px] mt-1">Member Services</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center py-10">
          <VantorisMonogram size={36} variant="flat" theme="light" className="mx-auto" />
          <p className="text-slate-400 text-xs mt-4 tracking-widest uppercase">Atchison Village Credit Union Identity System</p>
          <p className="text-slate-300 text-[10px] mt-1">Trust · Structure · Purpose</p>
        </div>
      </div>
    </div>
  );
}