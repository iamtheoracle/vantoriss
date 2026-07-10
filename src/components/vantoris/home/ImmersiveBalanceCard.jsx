import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { formatCurrency } from '@/lib/formatCurrency';
import { Wallet, Eye, EyeOff, Shield } from 'lucide-react';
import ShieldLogo from '@/components/vantoris/ShieldLogo';

export default function ImmersiveBalanceCard({
  totalBalance,
  availableBalance,
  pendingBalance,
  accountCount,
  hideBalance,
  onToggleBalance,
  firstName,
}) {
  const cardRef = useRef(null);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const rotateX = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });

  const glareX = useTransform(rotateY, [-15, 15], ['0%', '100%']);
  const glareY = useTransform(rotateX, [-15, 15], ['0%', '100%']);

  function handleMove(e) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    rotateY.set((x - 0.5) * 18);
    rotateX.set(-(y - 0.5) * 18);
    setGlarePos({ x: x * 100, y: y * 100 });
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-5 [perspective:1200px]"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onTouchMove={handleMove}
        onTouchEnd={handleLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="vantoris-balance-hero rounded-3xl p-6 relative overflow-hidden cursor-default"
      >
        {/* Ambient gold glow following pointer */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(201,162,39,0.18) 0%, transparent 45%)`,
          }}
        />

        {/* Top shine line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Decorative circles (3D depth) */}
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.04] blur-3xl"
          style={{ transform: 'translateZ(20px)' }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-champagne/[0.04] blur-3xl"
          style={{ transform: 'translateZ(10px)' }}
        />

        <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/12 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Wallet size={16} className="text-brass" />
              </div>
              <div>
                <span className="text-white/60 text-[10px] uppercase tracking-[0.18em] font-semibold block">Vantoris Vault</span>
                <span className="text-white/40 text-[9px]">Current Balance</span>
              </div>
            </div>
            <button
              onClick={onToggleBalance}
              className="p-2 rounded-xl hover:bg-white/10 transition-all border border-white/8"
              style={{ transform: 'translateZ(20px)' }}
            >
              {hideBalance ? <EyeOff size={16} className="text-white/60" /> : <Eye size={16} className="text-white/60" />}
            </button>
          </div>

          {/* Balance display */}
          <div className="mb-5">
            <h2 className="text-4xl font-bold text-white tracking-tight" style={{ textShadow: '0 2px 20px rgba(201,162,39,0.15)' }}>
              {hideBalance ? '••••••••' : formatCurrency(totalBalance)}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <Shield size={11} className="text-brass/70" />
              <p className="text-white/50 text-[11px]">
                {accountCount} {accountCount === 1 ? 'Account' : 'Accounts'} · Insured & Secured
              </p>
            </div>
          </div>

          {/* Split balances */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/8">
            <div style={{ transform: 'translateZ(25px)' }}>
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-1">Available</p>
              <p className="text-white font-semibold text-base">
                {hideBalance ? '••••••' : formatCurrency(availableBalance)}
              </p>
            </div>
            <div style={{ transform: 'translateZ(15px)' }}>
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium mb-1">Pending</p>
              <p className="text-white font-semibold text-base">
                {hideBalance ? '••••••' : formatCurrency(pendingBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom holographic strip */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.3), transparent)' }}
        />

        {/* Glare overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(${glarePos.y}deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}