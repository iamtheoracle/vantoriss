import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function SecurityPinModal({ open, onVerified, onClose, title = 'Security Verification Required', description = 'Enter your 6-digit security PIN to authorize this transaction.' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPin('');
      setError('');
      setVerifying(false);
    }
  }, [open]);

  async function handleVerify() {
    if (pin.length < 6) return;
    setError('');
    setVerifying(true);
    try {
      // In production this would validate against a stored PIN hash via backend
      // For now, we accept any 6-digit PIN as the PIN setup flow isn't built yet
      await new Promise(resolve => setTimeout(resolve, 600));
      onVerified();
    } catch (err) {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    } finally {
      setVerifying(false);
    }
  }

  function handleOpenChange(val) {
    if (!val) {
      if (!verifying) onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-brass/15 flex items-center justify-center">
              <ShieldCheck size={20} className="text-brass" />
            </div>
            <DialogTitle className="text-white">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-[#AAB4C3] text-sm">{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <div className="mt-2 rounded-lg border border-crimson/30 bg-crimson/10 p-2.5 text-xs text-red-400 font-medium">
            {error}
          </div>
        )}
        <div className="flex justify-center mt-4">
          <InputOTP
            maxLength={6}
            value={pin}
            onChange={setPin}
            autoFocus
            onComplete={handleVerify}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <button
          onClick={handleVerify}
          disabled={pin.length < 6 || verifying}
          className="w-full mt-4 py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all disabled:opacity-40"
        >
          {verifying ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </span>
          ) : (
            'Authorize'
          )}
        </button>
        <p className="text-center text-[10px] text-[#AAB4C3]/60 mt-2">
          For your security, this action requires PIN verification.
        </p>
      </DialogContent>
    </Dialog>
  );
}