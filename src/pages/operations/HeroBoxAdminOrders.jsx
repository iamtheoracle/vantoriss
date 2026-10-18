import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Package, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';

const STATUS_FLOW = ['payment_pending', 'paid', 'processing', 'packed', 'shipped', 'in_transit', 'delivered'];

export default function HeroBoxAdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setOrders(await base44.entities.HeroBoxOrder.list('-created_date', 50).catch(() => []));
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  async function handleAdvance(order) {
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    if (currentIdx < 1 || currentIdx >= STATUS_FLOW.length - 1) return;
    if (!order.updated_date || !order.payment_status) {
      toast({ title: 'Order needs refreshing', description: 'The order revision or payment state is missing. Reload before retrying.', variant: 'destructive' });
      return;
    }
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    setProcessing(order.id);
    let operationScope = '';
    try {
      operationScope = `herobox-order-fulfillment:${await fingerprintMutationScope(JSON.stringify({
        orderId: order.id,
        expectedStatus: order.status,
        nextStatus,
        expectedUpdatedDate: order.updated_date,
        expectedPaymentStatus: order.payment_status,
      }))}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('updateHeroBoxOrderStatus', {
        order_id: order.id,
        expected_status: order.status,
        next_status: nextStatus,
        expected_payment_status: order.payment_status,
        expected_updated_date: order.updated_date,
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      const savedOrder = result?.order;
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        result?.payment_fields_modified !== false ||
        result?.funds_moved_by_operation !== false ||
        savedOrder?.id !== order.id ||
        savedOrder?.status !== nextStatus ||
        savedOrder?.payment_status !== order.payment_status ||
        typeof savedOrder?.updated_date !== 'string' ||
        savedOrder.updated_date === order.updated_date
      ) {
        throw new Error(result?.error || 'The server did not confirm a fulfillment-only order update.');
      }
      await clearMutationIdempotencyKey(operationScope);
      toast({ title: 'Fulfillment updated', description: `Order status changed to ${nextStatus.replace(/_/g, ' ')}. Payment state was not changed.` });
      await loadData().catch(() => {});
    } catch (err) {
      toast({ title: 'Order update unavailable', description: err?.response?.data?.error || err.message || 'The server did not confirm the order update. Retry only with the same operation.', variant: 'destructive' });
    } finally {
      setProcessing('');
    }
  }


  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brass" /></div>;

  return (
    <OperationsPageLayout title="HeroBox Orders" description="Manage order fulfillment lifecycle" icon={Package}>
      {orders.length === 0 ? (
        <div className="vantoris-glass p-12 text-center">
          <Package size={32} className="text-gray mx-auto mb-3" />
          <p className="text-gray">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const currentIdx = STATUS_FLOW.indexOf(order.status);
            const canAdvance = currentIdx >= 1 && currentIdx < STATUS_FLOW.length - 1;
            return (
              <div key={order.id} className="vantoris-glass p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">VAN-{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray">{order.created_date?.substring(0, 10)} · {order.recipient_name} · {order.destination}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(order.total || 0)}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  {STATUS_FLOW.map((s, i) => (
                    <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= currentIdx ? 'bg-mint' : 'bg-slate-200'}`} />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray capitalize font-medium">{(order.status || '').replace(/_/g, ' ')}</span>
                  {canAdvance && (
                    <button
                      onClick={() => handleAdvance(order)}
                      disabled={processing === order.id}
                      className="px-3 py-1.5 rounded-lg bg-navy/10 text-navy text-xs font-semibold hover:bg-navy/20 transition"
                    >
                      {processing === order.id ? 'Updating...' : `Advance to ${STATUS_FLOW[currentIdx + 1].replace(/_/g, ' ')}`}
                    </button>
                  )}
                </div>
                {order.status === 'payment_pending' && (
                  <p className="mt-3 text-[11px] text-brass">Awaiting verified payment. Payment status cannot be advanced manually.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </OperationsPageLayout>
  );
}