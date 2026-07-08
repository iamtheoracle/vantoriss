import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail, UserPlus } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import AuthLayout from '@/components/AuthLayout';
import GoogleIcon from '@/components/GoogleIcon';
import { toast } from '@/components/ui/use-toast';

function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="mb-4 rounded-lg border border-[#F4A7B2] bg-[#FCE7EA] p-3 text-sm font-medium text-[#7F1020]">
      {message}
    </div>
  );
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function trackReferral() {
    if (!refCode) return;

    try {
      const me = await base44.auth.me();
      const referrers = await base44.entities.User.filter({ referral_code: refCode });

      if (referrers.length > 0) {
        const referrer = referrers[0];
        await base44.entities.Referral.create({
          referrer_id: referrer.id,
          referred_id: me.id,
          referred_email: email,
          referred_name: me.full_name || '',
          status: 'completed',
        });
      }
    } catch (refErr) {
      console.error('Referral tracking failed:', refErr);
    }
  }

  async function handleVerify() {
    setError('');
    setLoading(true);

    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });

      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }

      await trackReferral();
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');

    try {
      await base44.auth.resendOtp(email);