import React from "react";

const STEPS = [
  { num: 1, label: "Personal" },
  { num: 2, label: "Contact" },
  { num: 3, label: "Address" },
  { num: 4, label: "Employment" },
  { num: 5, label: "Identity" },
  { num: 6, label: "Security" },
  { num: 7, label: "Review" },
];

export default function StepProgress({ currentStep }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-navy">
          Step {currentStep} of 7
        </span>
        <span className="text-xs text-gray">{STEPS[currentStep - 1].label}</span>
      </div>
      <div className="flex items-center gap-1">
        {STEPS.map((step) => (
          <div
            key={step.num}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              step.num <= currentStep ? "bg-navy" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}