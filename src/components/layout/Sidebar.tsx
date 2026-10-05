import React from "react";
import {
  LayoutDashboard,
  Target,
  FileCheck2,
  CheckSquare,
  Briefcase,
  Building2,
  SlidersHorizontal,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  FolderLock,
  UploadCloud,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/supabase/auth-context";

export type ActiveTab =
  | "dashboard"
  | "opportunities"
  | "upload-tender"
  | "documents"
  | "company"
  | "compliance"
  | "tasks"
  | "bid-packages";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openTasksCount: number;
  activeOpportunitiesCount: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenAuthModal?: () => void;
  companyName?: string;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  openTasksCount,
  activeOpportunitiesCount,
  isMobileOpen,
  setIsMobileOpen,
  onOpenAuthModal,
  companyName,
}: SidebarProps) {
  const { profile } = useAuth();
  const navItems = [
    {
      id: "dashboard" as ActiveTab,
      label: "Decision Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "opportunities" as ActiveTab,
      label: "Healthcare Tenders",
      icon: Target,
      badge: activeOpportunitiesCount,
    },
    {
      id: "upload-tender" as ActiveTab,
      label: "Upload Tender PDF",
      icon: UploadCloud,
      badge: "OpenAI AI",
    },
    {
      id: "bid-packages" as ActiveTab,
      label: "Bid Packages",
      icon: Briefcase,
      badge: "2 Drafts",
    },
    {
      id: "compliance" as ActiveTab,
      label: "Compliance & Vault",
      icon: FileCheck2,
      badge: "6 Valid",
    },
    {
      id: "tasks" as ActiveTab,
      label: "Action Plan & Tasks",
      icon: CheckSquare,
      badge: openTasksCount > 0 ? `${openTasksCount} Open` : null,
      badgeCritical: true,
    },
    {
      id: "documents" as ActiveTab,
      label: "Company Documents",
      icon: FolderLock,
      badge: "Storage",
    },
    {
      id: "company" as ActiveTab,
      label: "Company Capabilities",
      icon: Building2,
      badge: null,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F2747]/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0F2747] text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 border-r border-[#16365F]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#16365F]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#2F80ED] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">BidderDecisions</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Healthcare SME Procurement AI
              </p>
            </div>
          </div>
        </div>

        {/* Company Active Context Switcher */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-[#16365F]/60 border border-[#1E4679]/60">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Active SME Supplier</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xs font-semibold text-slate-100 truncate">
            {companyName || profile?.companyName || "ApexMed Healthcare Ltd"}
          </div>
          <div className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
            <span>MDR & ISO 13485 Verified</span>
            <span>·</span>
            <span>UK / EU</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2">
          <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Procurement Engine
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left",
                  isActive
                    ? "bg-[#2F80ED] text-white shadow-xs"
                    : "text-slate-300 hover:bg-[#16365F]/80 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                      isActive
                        ? "bg-white/20 text-white"
                        : item.badgeCritical
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-[#16365F] text-slate-300 border border-[#1E4679]"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6 px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sector Targets
          </div>

          <div className="px-2 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center justify-between py-1 text-[11px]">
              <span className="text-slate-400">Medical Equipment</span>
              <span className="font-mono text-emerald-400 font-medium">92% fit</span>
            </div>
            <div className="flex items-center justify-between py-1 text-[11px]">
              <span className="text-slate-400">Laboratory & IVD</span>
              <span className="font-mono text-amber-400 font-medium">74% fit</span>
            </div>
            <div className="flex items-center justify-between py-1 text-[11px]">
              <span className="text-slate-400">Medical Devices</span>
              <span className="font-mono text-emerald-400 font-medium">88% fit</span>
            </div>
          </div>
        </nav>

        {/* Workflow reminder / footer badge */}
        <div className="p-3 mx-3 mb-3 bg-[#081628]/80 border border-[#16365F] rounded-lg">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#2F80ED]" />
            <span>AI Decision Flow</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Extract Specs → Capability Match → Bid/No-Bid Score → Action Plan → Bid Package
          </p>
        </div>

        {/* User profile strip */}
        <div
          onClick={onOpenAuthModal}
          className="p-3 border-t border-[#16365F] flex items-center justify-between cursor-pointer hover:bg-[#16365F]/50 transition-colors"
          title="Click to view Supabase Auth session & RLS"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#16365F] text-slate-200 text-xs font-semibold flex items-center justify-center border border-[#1E4679]">
              {profile?.avatarInitials || "AM"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-medium text-slate-200 truncate">
                {profile?.fullName || "Marcus Sterling"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {profile?.role || "Bid & Commercial Lead"}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1 py-0.5 rounded">
            RLS Active
          </span>
        </div>
      </aside>
    </>
  );
}
