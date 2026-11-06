import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, Clock3, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import VantorisMonogram from '@/components/vantoris/brand/VantorisMonogram';
import { BRAND } from '@/lib/brand';

const starterPrompts = [
  'Help me understand my accounts and available services',
  'Explain how to request a debit card',
  'Help me plan a savings goal',
];

export default function AVA({ mode = 'member' }) {
  const navigate = useNavigate();
  const isOperations = mode === 'operations';
  const prompts = isOperations
    ? ['Prepare a member application review checklist', 'Explain the transfer approval workflow', 'Help me structure an evidence-based case review']
    : starterPrompts;
  const [messages, setMessages] = useState(() => [{
    role: 'assistant',
    content: isOperations
      ? 'Hello. I’m AVA Operations, your Atchison Village staff assistant. I can help prepare reviews, organize evidence, explain procedures and draft approval packets within your role. I cannot approve or execute financial operations.'
      : 'Hello. I’m AVA, your Atchison Village assistant. I can help you understand your accounts, explore services, prepare requests and find the right next step. I will always ask for the required approval before any restricted action.',
  }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    let active = true;
    base44.functions.invoke('oracleRuntime', { action: 'history' })
      .then(result => {
        const data = result?.data ?? result;
        if (active && Array.isArray(data?.messages) && data.messages.length) {
          setMessages(current => current.length === 1 ? data.messages : current);
        }
      })
      .catch(() => {
        // Keep the welcome message if history is unavailable.
      });
    return () => { active = false; };
  }, []);

  async function sendMessage(value = input) {
    const message = String(value || '').trim();
    if (!message || sending) return;
    if (message.length > 4000) {
      setNotice('Please keep your message under 4,000 characters.');
      return;
    }
    setNotice('');
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setSending(true);
    try {
      const result = await base44.functions.invoke('oracleRuntime', { message });
      const data = result?.data ?? result;
      const content = typeof data?.response === 'string' && data.response.trim()
        ? data.response
        : 'I could not complete that response. Please try again.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content,
        pendingApproval: Boolean(data?.pendingApproval),
        escalated: Boolean(data?.escalated),
      }]);
      if (data?.pendingApproval) setNotice(isOperations ? 'A recommendation has been prepared for review. No controlled operation has been executed.' : 'Your request has been prepared and routed for authorized review. No restricted action has been executed.');
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I’m temporarily unable to reach the secure assistant service. Your request has not been submitted. Please try again shortly.' }]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border safe-top">
        <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-[#173D32] flex items-center justify-center">
            <VantorisMonogram size={34} variant="metallic" theme="dark" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-foreground leading-tight">{isOperations ? 'AVA Operations' : BRAND.assistant.name}</h1>
            <p className="text-xs text-gray truncate">{isOperations ? 'Atchison Village Operations Assistant' : BRAND.assistant.fullName}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#173D32] bg-[#173D32]/8 px-2.5 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> {isOperations ? 'Staff workspace' : 'Secure'}
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-5">
        <div className="rounded-2xl bg-[#173D32] text-white p-4 sm:p-5 mb-5">
          <div className="flex items-center gap-2 text-[#E5D2A8] text-xs font-semibold uppercase tracking-[.12em]">
            <ShieldCheck size={15} /> {isOperations ? 'Operations support' : 'Member support'}
          </div>
          <p className="mt-2 text-sm text-white/85">{isOperations ? 'Prepare case reviews, summarize permitted information and draft approval packets. AVA follows your staff role and cannot bypass approval or execution controls.' : 'Ask questions, explore services, prepare requests and understand your options. AVA cannot bypass member permissions or approval requirements.'}</p>
        </div>

        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user' ? 'bg-[#173D32] text-white rounded-br-md' : 'bg-white border border-border text-foreground rounded-bl-md'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                {message.pendingApproval && (
                  <div className="mt-3 pt-2 border-t border-current/15 flex items-center gap-2 text-xs">
                    <Clock3 size={14} /> Prepared for authorized review
                  </div>
                )}
                {message.escalated && <p className="mt-2 text-xs font-semibold">Escalated for staff review</p>}
              </div>
            </div>
          ))}
          {sending && <div className="flex justify-start"><div className="bg-white border border-border rounded-2xl px-4 py-3 text-sm text-gray flex items-center gap-2"><Sparkles size={15} className="text-[#C5A66A]" /> AVA is thinking…</div></div>}
          <div ref={scrollRef} />
        </div>

        {messages.length === 1 && (
          <div className="mt-6 flex flex-col gap-2">
            {prompts.map(prompt => (
              <button key={prompt} onClick={() => sendMessage(prompt)} className="text-left text-sm rounded-xl border border-border bg-white hover:border-[#C5A66A] px-4 py-3 transition-colors">
                {prompt}
              </button>
            ))}
          </div>
        )}
      </main>

      {notice && <p className="max-w-3xl w-full mx-auto px-4 pb-2 text-xs text-[#6B5A35]" role="status">{notice}</p>}
      <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-border safe-bottom">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-end gap-2">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={isOperations ? 'Ask AVA Operations…' : 'Ask AVA anything…'} rows={1} maxLength={4000} className="min-h-11 max-h-32 flex-1 resize-y rounded-2xl border border-border bg-[#F7F4EC] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C5A66A]/40" />
          <button type="submit" disabled={!input.trim() || sending} aria-label="Send message" className="w-11 h-11 rounded-full bg-[#173D32] text-white flex items-center justify-center disabled:opacity-40">
            <ArrowUp size={19} />
          </button>
        </div>
      </form>
    </div>
  );
}
