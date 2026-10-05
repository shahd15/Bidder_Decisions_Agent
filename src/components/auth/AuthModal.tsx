import React, { useState } from "react";
import { User, LogOut, Shield, CheckCircle2, Building2, Key, Database, RefreshCw } from "lucide-react";
import { useAuth } from "../../lib/supabase/auth-context";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { profile, user, signOut, signInDemoUser, isLiveSupabaseConfigured } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase User Session & Company Isolation"
      subtitle="Row Level Security (RLS) restricts access to your authenticated SME supplier"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* User Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0F2747] text-white font-bold flex items-center justify-center shrink-0">
            {profile?.avatarInitials || "AM"}
          </div>
          <div className="space-y-0.5 flex-1 min-w-0">
            <h4 className="font-bold text-sm text-[#0F2747]">{profile?.fullName}</h4>
            <p className="text-[11px] text-slate-500 font-medium">{profile?.role}</p>
            <p className="text-[11px] font-mono text-slate-600 truncate">{profile?.email}</p>
          </div>
        </div>

        {/* Company & RLS details */}
        <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Authenticated Company:</span>
            <span className="font-semibold text-slate-800">{profile?.companyName}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Company UUID:</span>
            <span className="font-mono text-slate-600 text-[10px]">{profile?.companyId}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">RLS Isolation Policy:</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              auth_company_id() match
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Supabase SSR Connection:</span>
            <span className="font-mono text-slate-700">
              {isLiveSupabaseConfigured ? "Live Backend" : "Local Browser Session"}
            </span>
          </div>
        </div>

        {/* Switch test accounts */}
        <div className="pt-2 border-t border-slate-100">
          <span className="block text-[11px] font-semibold text-slate-500 mb-2">
            Switch Test Profile:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                signInDemoUser("marcus");
                onClose();
              }}
              className={`p-2 rounded border text-left transition-colors ${
                profile?.fullName === "Marcus Sterling"
                  ? "border-[#2F80ED] bg-blue-50/50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-bold text-[11px]">Marcus Sterling</div>
              <div className="text-[10px] text-slate-500">Commercial Bid Lead</div>
            </button>
            <button
              onClick={() => {
                signInDemoUser("eleanor");
                onClose();
              }}
              className={`p-2 rounded border text-left transition-colors ${
                profile?.fullName === "Dr. Eleanor Vance"
                  ? "border-[#2F80ED] bg-blue-50/50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-bold text-[11px]">Dr. Eleanor Vance</div>
              <div className="text-[10px] text-slate-500">Quality & Compliance</div>
            </button>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
          <Button
            onClick={handleSignOut}
            variant="danger"
            size="sm"
            icon={<LogOut className="w-3.5 h-3.5" />}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </Button>

          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
