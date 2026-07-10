import React from "react";
import { Check } from "lucide-react";

function ReviewSection({ title, fields, onEdit }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-navy">{title}</h3>
        <button onClick={onEdit} className="text-xs text-navy font-medium hover:underline">Edit</button>
      </div>
      <div className="space-y-1.5">
        {fields.map((f, i) => (
          f.value && (
            <div key={i} className="flex justify-between gap-3">
              <span className="text-gray text-xs">{f.label}</span>
              <span className="text-foreground text-xs font-medium text-right">{f.value}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default function StepReview({ data, product, onEditStep, onConsentChange, consents }) {
  const fullName = [data.firstName, data.middleName, data.lastName, data.suffix].filter(Boolean).join(" ");
  const fullAddress = [data.street, data.apt, data.city, `${data.state} ${data.zip}`, data.country].filter(Boolean).join(", ");

  return (
    <div>
      <ReviewSection
        title="Account Type"
        onEdit={() => onEditStep(0)}
        fields={[{ label: "Selected Product", value: product?.label }]}
      />
      <ReviewSection
        title="Personal Information"
        onEdit={() => onEditStep(1)}
        fields={[
          { label: "Full Name", value: fullName },
          { label: "Date of Birth", value: data.dob },
          { label: "Citizenship", value: data.citizenship },
          { label: "Residency", value: data.residency },
        ]}
      />
      <ReviewSection
        title="Contact Information"
        onEdit={() => onEditStep(2)}
        fields={[
          { label: "Email", value: data.email },
          { label: "Mobile Phone", value: data.phone },
        ]}
      />
      <ReviewSection
        title="Residential Address"
        onEdit={() => onEditStep(3)}
        fields={[{ label: "Address", value: fullAddress }]}
      />
      <ReviewSection
        title="Employment & Financial"
        onEdit={() => onEditStep(4)}
        fields={[
          { label: "Employment", value: data.employment },
          { label: "Employer", value: data.employer },
          { label: "Occupation", value: data.occupation },
          { label: "Annual Income", value: data.annualIncome },
          { label: "Source of Funds", value: data.sourceOfFunds },
        ]}
      />
      <ReviewSection
        title="Identity Verification"
        onEdit={() => onEditStep(5)}
        fields={[
          { label: "Government ID", value: data.govId?.name || "Not uploaded" },
          { label: "Selfie", value: data.selfie?.name || "Not uploaded" },
          { label: "Address Proof", value: data.addressProof?.name || "Not uploaded" },
        ]}
      />

      <div className="space-y-3 mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray">Consents & Disclosures</p>
        {[
          { key: "regulatory", label: "I have read and agree to the Deposit Account Agreement and Disclosures." },
          { key: "privacy", label: "I acknowledge the Privacy Notice and consent to information sharing as described." },
          { key: "electronic", label: "I consent to electronic delivery of documents and agreements." },
        ].map((item) => (
          <label key={item.key} className="flex items-start gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => onConsentChange(item.key, !consents[item.key])}
              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                consents[item.key] ? "bg-navy border-navy" : "border-slate-300 bg-white"
              }`}
            >
              {consents[item.key] && <Check size={12} className="text-white" />}
            </button>
            <span className="text-xs text-gray leading-relaxed">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}