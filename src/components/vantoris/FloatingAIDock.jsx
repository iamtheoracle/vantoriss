import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import AgentChat from './AgentChat';

export default function FloatingAIDock() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24, delay: 0.4 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 safe-bottom"
        style={{
          background: 'linear-gradient(145deg, #071C38 0%, #0E2A4A 100%)',
          border: '1px solid rgba(201, 162, 39, 0.3)',
          boxShadow: '0 8px 24px rgba(7, 28, 56, 0.25)',
        }}
        title="Ask Vantoris AI"
      >
        <Bot size={24} className="text-brass" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-mint rounded-full border-2 border-white" />
      </motion.button>

      {/* Slide-up panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/20"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 36 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[600px] bg-white flex flex-col safe-top safe-bottom"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 vantoris-glass-header">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-navy/8 flex items-center justify-center">
                    <Bot size={18} className="text-navy" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Vantoris AI Assistant</h3>
                    <p className="text-gray text-[11px]">Operations Co-Pilot</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-gray hover:bg-slate-100 hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat body */}
              <div className="flex-1 overflow-hidden">
                <AgentChat
                  agentName="vantoris_assistant"
                  title="Vantoris AI Assistant"
                  subtitle="Operations Co-Pilot"
                  inputPlaceholder="Ask about members, applications, KYC, accounts, withdrawals…"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}