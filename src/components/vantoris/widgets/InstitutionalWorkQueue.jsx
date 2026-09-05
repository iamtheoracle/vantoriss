import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, ArrowUpRight, ShieldAlert } from 'lucide-react';

const STAGE_LABELS = {
  observe: 'Observing', investigate: 'Investigating', analyze: 'Analyzing', corroborate: 'Corroborating',
  assess: 'Assessing', collaborate: 'Collaborating', recommend: 'Recommendation', authorize: 'Authorization',
  execute: 'Executing', verify: 'Verifying', record: 'Recording', learn: 'Learning', closed: 'Closed',
};

export default function InstitutionalWorkQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.InstitutionalWorkItem.list('-updated_at', 12);
        if (active) setItems((rows || []).filter((row) => row.work_status !== 'completed' && row.work_status !== 'rejected').slice(0, 8));
      } catch (error) {
        console.error('Institutional work queue failed', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="vantoris-glass-premium p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-navy" />
          <div>
            <h3 className="text-foreground font-semibold text-sm">Institutional Work</h3>
            <p className="text-gray text-[10px] mt-0.5">Command coordination and active cases</p>
          </div>
        </div>
        <span className="text-[10px] font-medium text-gray">{items.length} active</span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray">Loading institutional work…</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center">
          <Activity size={22} className="text-gray/30 mx-auto mb-2" />
          <p className="text-gray text-xs">No active institutional work</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const waiting = item.work_status === 'awaiting_authorization' || item.authorization_state === 'pending' || item.authorization_state === 'required';
            return (
              <div key={item.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${waiting ? 'bg-amber-50 border-amber-200' : 'bg-navy/8 border-navy/10'}`}>
                  {waiting ? <ShieldAlert size={14} className="text-amber-700" /> : <Activity size={14} className="text-navy" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-xs font-medium truncate">{item.objective || 'Institutional work item'}</p>
                  <p className="text-gray text-[10px] truncate">
                    {item.lead_division || 'operations'} · {STAGE_LABELS[item.lifecycle_stage] || item.lifecycle_stage || 'Active'}
                    {Array.isArray(item.participating_divisions) && item.participating_divisions.length > 1 ? ` · ${item.participating_divisions.length} divisions` : ''}
                  </p>
                </div>
                {waiting && <span className="text-[9px] font-semibold text-amber-700 whitespace-nowrap">AUTH</span>}
                <ArrowUpRight size={12} className="text-gray/50 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
