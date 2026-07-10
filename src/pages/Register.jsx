import React, { useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import StepProgress from "@/components/auth/StepProgress";
import ProductSelection, { PRODUCTS } from "@/components/auth/ProductSelection";
import ApplicationStatus from "@/components/auth/ApplicationStatus";
import StepPersonalInfo from "@/components/auth/StepPersonalInfo";
import StepContactInfo from "@/components/auth/StepContactInfo";
import StepVerification from "@/components/auth/StepVerification";
import StepAddress from "@/components/auth/StepAddress";
import StepIdentity from "@/components/auth/StepIdentity";
import StepFinancial from "@/components/auth/StepFinancial";
import StepSecurity from "@/components/auth/StepSecurity";
import StepReview from "@/components/auth/StepReview";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

const INITIAL_DATA = {
  firstName: "", middleName: "", lastName: "", suffix: "", dob: "",
  email: "", phone: "",
  street: "", apt: "", city: "", state: "", zip: "", country: "US",
  ssn: "", govId: null, selfie: null,
  employment: "", employer: "", occupation: "", annualIncome: "", sourceOfFunds: "",
  userId: "", password: "", confirmPassword: "", securityPin: "", faceId: false,
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const navigate = useNavigate();

  const [phase, setPhase] = useState("products");
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [data, setData] = useState(INITIAL_DATA);
  const [consents, setConsents] = useState({ regulatory: false, privacy: false, electronic: false });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);

  const updateData = useCallback((updates) => setData((prev) => ({ ...prev, ...updates })), []);

  function handleBack() {
    setError("");
    if (step > 1) {
      setStep(step - 1);
    } else {
      setPhase("products");
    }
  }

  function isStepValid() {
    switch (step) {
      case 1: return data.firstName && data.lastName && data.dob;
      case 2: return data.email && data.phone;
      case 3: return !!data.phone;
      case 4: return data.street && data.city && data.state && data.zip && data.country;
      case 5: return data.ssn && data.govId && data.selfie;
      case 6: return data.employment && data.annualIncome && data.sourceOfFunds;
      case 7: return data.userId && data.password && data.confirmPassword && data.securityPin && data.password === data.confirmPassword;
      case 8: return consents.regulatory && consents.privacy && consents.electronic;
      default: return true;
    }
  }

  async function handleNext() {
    setError("");
    if (step < 7) {
      setStep(step + 1);
      return;
    }
    if (step === 7) {
      if (data.password !== data.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (data.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      setLoading(true);
      try {
        await base44.auth.register({ email: data.userId || data.email, password: data.password });
        setOtpSent(true);
      } catch (err) {
        setError(err.message || "Registration failed. This User ID may already be in use.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 8) {
      await handleSubmitApplication();
    }
  }

  async function handleVerifyOtp() {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: data.userId || data.email, otpCode });
      if (!result?.access_token) {
        setError("Verification completed but no session token was returned. Please try again.");
        return;
      }
      base44.auth.setToken(result.access_token);
      await trackReferral();
      await base44.auth.updateMe({
        full_name: [data.firstName, data.middleName, data.lastName, data.suffix].filter(Boolean).join(" "),
      });
      setOtpSent(false);
      setStep(8);
    } catch (err) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    try {
      await base44.auth.resendOtp(data.userId || data.email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    }
  }

  async function trackReferral() {
    if (!refCode) return;
    try {
      const me = await base44.auth.me();
      const referrers = await base44.entities.User.filter({ referral_code: refCode });
      if (referrers.length > 0) {
        await base44.entities.Referral.create({
          referrer_id: referrers[0].id,
          referred_id: me.id,
          referred_email: data.userId || data.email,
          referred_name: `${data.firstName} ${data.lastName}`,
          status: "completed",
        });
      }
    } catch (refErr) {
      console.error("Referral tracking failed:", refErr);
    }
  }

  async function handleSubmitApplication() {
    setLoading(true);
    setError("");
    try {
      const me = await base44.auth.me();
      const fullName = [data.firstName, data.middleName, data.lastName, data.suffix].filter(Boolean).join(" ");
      const fullAddress = [data.street, data.apt, data.city, `${data.state} ${data.zip}`, data.country].filter(Boolean).join(", ");

      const docUrls = [];
      for (const file of [data.govId, data.selfie]) {
        if (file) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          docUrls.push(file_url);
        }
      }

      await base44.entities.Application.create({
        user_id: me.id,
        full_name: fullName,
        email: data.userId || data.email,
        phone: data.phone,
        address: fullAddress,
        business_name: ["Business", "Institutional", "Organization"].includes(selectedProduct?.label) ? data.employer || "" : "",
        account_type: selectedProduct.accountType,
        kyc_status: "not_started",
        application_status: "pending",
        kyc_documents: docUrls,
        kyc_notes: JSON.stringify({
          product: selectedProduct.label,
          dob: data.dob,
          ssn: data.ssn,
          employment: data.employment,
          employer: data.employer,
          occupation: data.occupation,
          annualIncome: data.annualIncome,
          sourceOfFunds: data.sourceOfFunds,
          securityPin: data.securityPin ? "set" : "",
          faceId: data.faceId,
        }),
      });

      await base44.entities.Notification.create({
        user_id: me.id,
        title: "Application Received",
        message: `Your ${selectedProduct.label} application has been received and is under review. You will be notified once a determination has been made.`,
        type: "info",
      });

      setStatus({
        type: "review",
        reference: `VAN-${me.id.slice(-8).toUpperCase()}`,
      });
      setPhase("status");
    } catch (err) {
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "products") {
    return (
      <AuthLayout
        bare
        footer={
          <span>
            Already a member?{" "}
            <Link to="/login" className="text-navy font-medium hover:underline">
              Sign In
            </Link>
          </span>
        }
      >
        <ProductSelection
          selected={selectedProduct}
          onSelect={setSelectedProduct}
          onBack={() => navigate("/login")}
        />
        {selectedProduct && (
          <button
            onClick={() => { setPhase("application"); setStep(1); }}
            className="w-full h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2 mt-6"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        )}
      </AuthLayout>
    );
  }

  if (phase === "status") {
    return (
      <AuthLayout bare>
        <ApplicationStatus status={status} onContinue={() => { window.location.href = "/"; }} />
      </AuthLayout>
    );
  }

  if (otpSent) {
    return (
      <AuthLayout title="Verify Your Email" subtitle={`We sent a verification code to ${data.userId || data.email}`}>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-crimson/10 border border-crimson/20 text-crimson text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
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
          onClick={handleVerifyOtp}
          disabled={loading || otpCode.length < 6}
          className="w-full h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Verify Code"}
        </button>
        <div className="flex items-center justify-between mt-4 text-xs">
          <button onClick={() => { setOtpSent(false); setError(""); }} className="text-gray hover:text-foreground">
            ← Back to form
          </button>
          <button onClick={handleResendOtp} className="text-navy font-medium hover:underline">
            Resend code
          </button>
        </div>
      </AuthLayout>
    );
  }

  const stepTitles = {
    1: "Personal Information",
    2: "Contact Information",
    3: "Verification",
    4: "Residential Address",
    5: "Identity Verification",
    6: "Financial Information",
    7: "Security",
    8: "Review & Submit",
  };

  return (
    <AuthLayout title={stepTitles[step]}>
      <StepProgress currentStep={step} />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-crimson/10 border border-crimson/20 text-crimson text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        {step === 1 && <StepPersonalInfo data={data} updateData={updateData} />}
        {step === 2 && <StepContactInfo data={data} updateData={updateData} />}
        {step === 3 && <StepVerification data={data} />}
        {step === 4 && <StepAddress data={data} updateData={updateData} />}
        {step === 5 && <StepIdentity data={data} updateData={updateData} />}
        {step === 6 && <StepFinancial data={data} updateData={updateData} />}
        {step === 7 && <StepSecurity data={data} updateData={updateData} />}
        {step === 8 && (
          <StepReview
            data={data}
            product={selectedProduct}
            onEditStep={(s) => s === 0 ? setPhase("products") : setStep(s)}
            consents={consents}
            onConsentChange={(key, val) => setConsents((prev) => ({ ...prev, [key]: val }))}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray hover:text-foreground transition px-2"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isStepValid() || loading}
          className="flex-1 h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : step === 8 ? (
            <><ShieldCheck size={18} /> Submit Application</>
          ) : (
            <>Continue <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </AuthLayout>
  );
}