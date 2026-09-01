import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, MapPin, User, Package, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';

export default function CheckoutFlow({ cart, onClose, onOrderComplete }) {
  const [step, setStep] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const [destination, setDestination] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const { toast } = useToast();

  const subtotal = cart.reduce((s, item) => {
    const price = item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
    return s + price * item.quantity;
  }, 0);
  const discount = cart.reduce((s, item) => {
    if (item.discount > 0) return s + (item.price * item.discount / 100) * item.quantity;
    return s;
  }, 0);
  const shippingCost = subtotal > 0 ? 15 : 0;
  const total = subtotal + shippingCost;

  async function handleSubmit() {
    if (!recipientName || !destination) {
      toast({ title: 'Missing information', description: 'Please enter recipient name and destination.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      const order = await base44.entities.HeroBoxOrder.create({
        user_id: me.id,
        recipient_name: recipientName,
        destination,
        destination_address: address,
        items: JSON.stringify(cart.map(c => ({
          product_id: c.product_id,
          name: c.name,
          category: c.category,
          price: c.discount > 0 ? c.price * (1 - c.discount / 100) : c.price,
          quantity: c.quantity,
        }))),
        subtotal,
        discount,
        shipping_cost: shippingCost,
        total,
        status: 'payment_pending',
        payment_status: 'pending',
      });
      setCompletedOrder(order);
      setStep(4);
      toast({ title: 'Order created', description: `Order reference: VAN-${order.id.slice(-8).toUpperCase()}` });
    } catch (err) {
      toast({ title: 'Order failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.length === 0 && !completedOrder) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <p className="text-center text-gray text-sm py-8">Your HeroBox is empty.</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-navy text-white text-sm font-semibold">Browse Products</button>
        </div>
      </div>
    );
  }

  if (completedOrder) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-mint/10 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-mint" />
          </div>
          <h3 className="text-lg font-bold text-foreground text-center mb-2">Order Created</h3>
          <p className="text-xs text-gray text-center mb-1">Your order has been created and is awaiting payment.</p>
          <p className="text-xs text-gray text-center mb-4">Reference: VAN-{completedOrder.id.slice(-8).toUpperCase()}</p>
          <p className="text-xs text-gray text-center mb-6">Status: Payment Pending — your order will be processed once payment is confirmed.</p>
          <button onClick={() => { onOrderComplete(); onClose(); }} className="w-full py-3 rounded-xl bg-navy text-white text-sm font-semibold">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Checkout</h3>
          <button onClick={onClose}><X size={20} className="text-gray" /></button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-5">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-brass' : 'bg-slate-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-gray" />
              <p className="text-sm font-semibold text-foreground">Recipient</p>
            </div>
            <input
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Recipient full name"
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm focus:border-brass/50 focus:outline-none"
            />
            <div className="flex items-center gap-2 mb-2 mt-4">
              <MapPin size={16} className="text-gray" />
              <p className="text-sm font-semibold text-foreground">Destination</p>
            </div>
            <input
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="Country / region"
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm focus:border-brass/50 focus:outline-none"
            />
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Full shipping address (optional)"
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm focus:border-brass/50 focus:outline-none min-h-[80px]"
            />
            <button
              onClick={() => setStep(2)}
              disabled={!recipientName || !destination}
              className="w-full py-3 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-gray" />
              <p className="text-sm font-semibold text-foreground">Review Items</p>
            </div>
            {cart.map(item => {
              const price = item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
              return (
                <div key={item.product_id} className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-gray">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(price * item.quantity)}</p>
                </div>
              );
            })}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-gray">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-navy text-white text-sm font-semibold">Review Total</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">Order Summary</p>
            <div className="vantoris-glass-flat p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray">Items ({cart.reduce((s, c) => s + c.quantity, 0)})</span>
                <span className="text-foreground font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-mint">Discount</span>
                  <span className="text-mint font-medium">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray">Shipping</span>
                <span className="text-foreground font-medium">{formatCurrency(shippingCost)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-foreground font-semibold">Total</span>
                <span className="text-foreground font-bold text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="vantoris-glass-flat p-3">
              <p className="text-xs text-gray">Recipient: <span className="text-foreground font-medium">{recipientName}</span></p>
              <p className="text-xs text-gray">Destination: <span className="text-foreground font-medium">{destination}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-gray">Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-navy text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}