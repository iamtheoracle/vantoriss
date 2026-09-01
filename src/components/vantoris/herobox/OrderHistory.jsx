import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Package, Loader2, Truck, Check, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

const STATUS_META = {
  draft: { icon: Clock, color: 'text-gray', bg: 'bg-slate-100', label: 'Draft' },
  payment_pending: { icon: Clock, color: 'text-brass', bg: 'bg-brass/10', label: 'Payment Pending' },
  paid: { icon: Check, color: 'text-mint', bg: 'bg-mint/10', label: 'Paid' },
  processing: { icon: Package, color: 'text-champagne', bg: 'bg-champagne/10', label: 'Processing' },
  packed: { icon: Package, color: 'text-champagne', bg: 'bg-champagne/10', label: 'Packed' },
  shipped: { icon: Truck, color: 'text-champagne', bg: 'bg-champagne/10', label: 'Shipped' },
  in_transit: { icon: Truck, color: 'text-champagne', bg: 'bg-champagne/10', label: 'In Transit' },
  delivered: { icon: Check, color: 'text-mint', bg: 'bg-mint/10', label: 'Delivered' },
  exception: { icon: AlertCircle, color: 'text-crimson', bg: 'bg-crimson/10', label: 'Exception' },
  cancelled: { icon: AlertCircle, color: 'text-gray', bg: 'bg-slate-100', label: 'Cancelled' },
  refunded: { icon: AlertCircle, color: 'text-gray', bg: 'bg-slate-100', label: 'Refunded' },
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    const ords = await base44.entities.HeroBoxOrder.filter({ user_id: me.id }, '-created_date', 20).catch(() => []);
    setOrders(ords);
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brass" /></div>;

  if (orders.length === 0) {
    return (
      <div className="vantoris-glass p-8 text-center">
        <Package size={32} className="text-gray mx-auto mb-3" />
        <p className="text-foreground text-sm font-semibold">No Orders Yet</p>
        <p className="text-gray text-xs mt-1">Your HeroBox orders will appear here once you place them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(order => {
        const meta = STATUS_META[order.status] || STATUS_META.draft;
        const StatusIcon = meta.icon;
        let items = [];
        try { items = JSON.parse(order.items || '[]'); } catch (e) {}
        return (
          <div key={order.id} className="vantoris-glass p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-foreground">VAN-{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-gray">{order.created_date?.substring(0, 10)}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}>
                <StatusIcon size={12} /> {meta.label}
              </span>
            </div>
            <div className="text-xs text-gray space-y-0.5">
              <p>Recipient: <span className="text-foreground">{order.recipient_name}</span></p>
              <p>Destination: <span className="text-foreground">{order.destination}</span></p>
              <p>Items: <span className="text-foreground">{items.length} product(s)</span></p>
            </div>
            {order.tracking_number && (
              <p className="text-xs text-champagne mt-2">Tracking: {order.tracking_number}</p>
            )}
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
              <span className="text-xs text-gray">Total</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(order.total || 0)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}