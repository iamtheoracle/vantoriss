import React from "react";
import { TextField, ToggleField } from "@/components/auth/FormField";
import { Mail, Lock, KeyRound } from "lucide-react";

export default function StepSecurity({ data, updateData }) {
  return (
    <div className="space-y-4">
      <TextField
        label="Create User ID"
        type="email"
        value={data.userId || data.email || ""}
        onChange={(v) => updateData({ userId: v })}
        placeholder="you@example.com"
        required
        autoComplete="email"
        icon={Mail}
      />
      <TextField
        label="Create Password"
        type="password"
        value={data.password}
        onChange={(v) => updateData({ password: v })}
        placeholder="••••••••"
        required
        autoComplete="new-password"
        icon={Lock}
      />
      <p className="text-[11px] text-gray -mt-2">Minimum 8 characters with at least one letter and one number.</p>
      <TextField
        label="Confirm Password"
        type="password"
        value={data.confirmPassword}
        onChange={(v) => updateData({ confirmPassword: v })}
        placeholder="••••••••"
        required
        autoComplete="new-password"
        icon={Lock}
      />
      <TextField
        label="Security PIN"
        type="password"
        value={data.securityPin}
        onChange={(v) => updateData({ securityPin: v })}
        placeholder="4–6 digit PIN"
        required
        autoComplete="off"
        icon={KeyRound}
      />
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
        <ToggleField
          label="Enable Face ID"
          description="Use biometric authentication for faster, secure sign-in"
          checked={data.faceId || false}
          onChange={(v) => updateData({ faceId: v })}
        />
      </div>
    </div>
  );
}