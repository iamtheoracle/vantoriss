import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

/**
 * WhatsApp-style read receipt checkmarks.
 * - Single gray check: message sent (not yet read by recipient)
 * - Double blue check: message read by recipient
 */
export default function ReadReceipt({ read, className = '' }) {
  if (read) {
    return <CheckCheck size={13} className={`text-champagne ${className}`} strokeWidth={2.5} />;
  }
  return <Check size={13} className={`text-gray/50 ${className}`} strokeWidth={2.5} />;
}