import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function TextField({ label, value, onChange, type = "text", placeholder, required, autoComplete, icon: Icon }) {
  // Sync autofilled values into React state. Browsers (iOS Safari, Android Chrome,
  // password managers) may fill the DOM without firing a synthetic onChange event.
  // Listening to onInput and onBlur in addition to onChange, and checking the DOM
  // value on mount, ensures React state stays in sync in all environments.
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    // Some browsers (e.g. iOS Safari) apply autofill asynchronously after mount.
    // Poll once after a short delay to catch values that are already in the DOM.
    const timer = setTimeout(() => {
      if (el.value && el.value !== (value || "")) {
        onChange(el.value);
      }
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => onChange(e.target.value);
  const handleBlur = (e) => {
    // Only sync on blur if the DOM value differs from React state (autofill capture).
    if (e.target.value !== (value || "")) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-gray">
        {label}{required && <span className="text-crimson ml-0.5">*</span>}
      </Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />}
        <Input
          ref={inputRef}
          type={type}
          value={value || ""}
          onChange={handleChange}
          onInput={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`h-12 bg-white border-slate-200 ${Icon ? "pl-10" : ""}`}
        />
      </div>
    </div>
  );
}

export function SelectField({ label, value, onChange, options, required, placeholder = "Select..." }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-gray">
        {label}{required && <span className="text-crimson ml-0.5">*</span>}
      </Label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function ToggleField({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-gray mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}