import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import SplashScreen from "@/components/auth/SplashScreen";
import OnboardingCarousel from "@/components/auth/OnboardingCarousel";
import { Loader2, Lock, User } from "lucide-react";

export default function Login() {
  const [phase, setPhase] = useState("splash");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberId, setRememberId] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("vantoris_user_id");
    if (saved) {
      setUserId(saved);
      setRememberId(true);
    }
  }, []);

  function handleSplashDone() {
    const seen = localStorage.getItem("vantoris_onboarding_seen");
    setPhase(seen ? "login" : "onboarding");
  }

  function handleOnboardingComplete() {
    localStorage.setItem("vantoris_onboarding_seen", "true");
    setPhase("login");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (rememberId) localStorage.setItem("vantoris_user_id", userId);
      else localStorage.removeItem("vantoris_user_id");
      await base44.auth.loginViaEmailPassword(userId, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid User ID or password.");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "splash") {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  if (phase === "onboarding") {
    return (
      <OnboardingCarousel
        onGetStarted={() => navigate("/register")}
        onSignIn={handleOnboardingComplete}
        onSkip={handleOnboardingComplete}
      />
    );
  }

  return (
    <AuthLayout
      title="Sign In to Your Account"
      footer={
        <span>
          Need to open an account?{" "}
          <Link to="/register" className="text-navy font-medium hover:underline">
            Get Started
          </Link>
        </span>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-crimson/10 border border-crimson/20 text-crimson text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray">User ID</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
            <input
              type="email"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              required
              className="w-full h-12 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-12 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberId}
            onChange={(e) => setRememberId(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-navy focus:ring-navy/20"
          />
          <span className="text-sm text-gray">Remember User ID</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Log In"
          )}
        </button>
      </form>
      <div className="flex flex-col gap-2 mt-5 text-center text-xs">
        <Link to="/forgot-password" className="text-gray hover:text-navy transition">Forgot User ID</Link>
        <Link to="/forgot-password" className="text-gray hover:text-navy transition">Forgot Password</Link>
        <Link to="/forgot-password" className="text-gray hover:text-navy transition">Need Help?</Link>
      </div>
    </AuthLayout>
  );
}