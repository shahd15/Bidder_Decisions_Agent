import React, { useState } from "react";
import { Shield, Lock, ArrowRight, Building2, User, Key, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../lib/supabase/auth-context";
import { Button } from "../ui/Button";

interface ProtectedDashboardRouteProps {
  children: React.ReactNode;
}

export function ProtectedDashboardRoute({ children }: ProtectedDashboardRouteProps) {
  const { isAuthenticated, isLoading, signInWithEmail, signUpWithEmail, signInDemoUser, isLiveSupabaseConfigured } =
    useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-lg bg-[#0F2747] text-white flex items-center justify-center animate-pulse mb-3">
          <Shield className="w-5 h-5 text-[#2F80ED]" />
        </div>
        <p className="text-xs text-slate-500 font-medium">Verifying Supabase Session & RLS Permissions...</p>
      </div>
    );
  }

  // If authenticated, render protected dashboard application
  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    if (mode === "signin") {
      const res = await signInWithEmail(email, password);
      if (res.error) {
        setErrorMessage(res.error.message || "Failed to sign in. Please verify your credentials.");
      }
    } else {
      if (!fullName || !companyName) {
        setErrorMessage("Please complete all required fields.");
        setIsSubmitting(false);
        return;
      }
      const res = await signUpWithEmail(email, password, fullName, companyName);
      if (res.error) {
        setErrorMessage(res.error.message || "Sign up failed.");
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0F2747] text-white shadow-md mb-3">
          <Shield className="w-6 h-6 text-[#2F80ED]" />
        </div>
        <h2 className="text-2xl font-bold text-[#0F2747] tracking-tight">BidderDecisions</h2>
        <p className="text-xs text-slate-500 mt-1">
          Healthcare SME Procurement AI Decision Engine
        </p>

        {isLiveSupabaseConfigured ? (
          <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live Supabase Authentication & RLS Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F80ED]" />
            Supabase Client Initialized (Local Session Ready)
          </span>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-200 sm:rounded-xl sm:px-10">
          <div className="flex border-b border-slate-200 mb-6 text-xs">
            <button
              onClick={() => setMode("signin")}
              className={`pb-3 font-semibold flex-1 text-center border-b-2 -mb-px transition-colors ${
                mode === "signin"
                  ? "border-[#2F80ED] text-[#2F80ED]"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Sign In to Procurement Portal
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`pb-3 font-semibold flex-1 text-center border-b-2 -mb-px transition-colors ${
                mode === "signup"
                  ? "border-[#2F80ED] text-[#2F80ED]"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Register Healthcare SME
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Eleanor Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Company / Supplier Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ApexMed Healthcare Solutions Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED] text-xs"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-700 font-medium mb-1">Work Email Address</label>
              <input
                type="email"
                required
                placeholder="m.sterling@apexmed-solutions.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED] text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED] text-xs"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full font-semibold mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Authenticating with Supabase..."
                : mode === "signin"
                ? "Sign In to Dashboard"
                : "Create Supplier Account"}
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-xs">
            <span className="block text-slate-400 text-center text-[11px] font-medium mb-2.5 uppercase tracking-wider">
              Quick Test Accounts (Instant Sign-In)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => signInDemoUser("marcus")}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-[#2F80ED] bg-slate-50 hover:bg-white text-left transition-all"
              >
                <div className="font-bold text-slate-800 text-[11px]">Marcus Sterling</div>
                <div className="text-[10px] text-slate-500">Commercial Bid Lead</div>
              </button>
              <button
                type="button"
                onClick={() => signInDemoUser("eleanor")}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-[#2F80ED] bg-slate-50 hover:bg-white text-left transition-all"
              >
                <div className="font-bold text-slate-800 text-[11px]">Dr. Eleanor Vance</div>
                <div className="text-[10px] text-slate-500">Quality & MDR Director</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-400">
          Protected by Supabase Row Level Security (RLS) · Company Isolation Policy Enforced
        </div>
      </div>
    </div>
  );
}
