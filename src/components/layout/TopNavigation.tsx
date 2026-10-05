import React, { useState } from "react";
import {
  Menu,
  Search,
  Bell,
  Plus,
  Database,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Filter,
} from "lucide-react";
import { Button } from "../ui/Button";
import { ActiveTab } from "./Sidebar";
import { isSupabaseConfigured } from "../../lib/supabase";
import { useAuth } from "../../lib/supabase/auth-context";

interface TopNavigationProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  onOpenImportModal: () => void;
  onOpenAuthModal?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
}

export function TopNavigation({
  activeTab,
  onOpenMobileMenu,
  onOpenImportModal,
  onOpenAuthModal,
  searchQuery,
  setSearchQuery,
  selectedSector,
  setSelectedSector,
}: TopNavigationProps) {
  const { profile, isLiveSupabaseConfigured } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Executive Procurement Overview",
      subtitle: "Healthcare SME Bid/No-Bid Decision Engine",
    },
    opportunities: {
      title: "Healthcare Tenders Pipeline",
      subtitle: "Active NHS & European Hospital RFPs and Frameworks",
    },
    "upload-tender": {
      title: "Tender PDF Upload & AI Parsing",
      subtitle: "OpenAI Responses API specification extraction & Supabase database indexing",
    },
    documents: {
      title: "Company Documents & Storage Vault",
      subtitle: "Private Supabase Storage for ISOs, CE MDR, financial statements & contracts",
    },
    company: {
      title: "Company Capabilities & Evidence Vault",
      subtitle: "ApexMed Healthcare Solutions Ltd Profile & Regulatory Footprint",
    },
    compliance: {
      title: "Regulatory Compliance & Standards Matrix",
      subtitle: "ISO 13485, EU MDR, DSPT & NHS Mandatory Exclusion Records",
    },
    tasks: {
      title: "Procurement Action Plan & RFIs",
      subtitle: "Clarification questions, specification sign-offs & risk mitigations",
    },
    "bid-packages": {
      title: "AI-Assisted Bid Package Drafts",
      subtitle: "First-draft tender submissions, technical schedules & commercial offers",
    },
  };

  const notifications = [
    {
      id: "1",
      title: "Clarification Answer Received",
      desc: "NHS London Hub clarified telemetry cable warranty requirements.",
      time: "25 min ago",
      type: "info",
    },
    {
      id: "2",
      title: "Critical Clarification Deadline",
      desc: "Charité Berlin reagent questions close in 72 hours.",
      time: "2 hrs ago",
      type: "warning",
    },
    {
      id: "3",
      title: "Bid Package v1.4 Generated",
      desc: "Technical compliance matrix draft ready for ICU Ventilators.",
      time: "Yesterday",
      type: "success",
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left side: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>BidderDecisions</span>
            <span>/</span>
            <span className="text-[#0F2747] font-semibold">
              {tabTitles[activeTab]?.title}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {tabTitles[activeTab]?.subtitle}
          </div>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="flex-1 max-w-md mx-3 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenders, CPV codes, hospital trusts, or requirements..."
            className="w-full h-9 pl-9 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED] focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sector Quick Filter */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px]">Filter Sector:</span>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
          >
            <option value="All">All Sectors (6)</option>
            <option value="Medical Equipment">Medical Equipment</option>
            <option value="Medical Devices">Medical Devices</option>
            <option value="Laboratory & Reagents">Laboratory & Reagents</option>
            <option value="Healthcare IT">Healthcare IT</option>
            <option value="Hospital Facilities">Hospital Facilities</option>
          </select>
        </div>

        {/* Database state indicator */}
        <button
          onClick={onOpenAuthModal}
          title="Click to view Supabase Auth session & RLS"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
        >
          <Database className="w-3 h-3 text-emerald-600" />
          <span className="font-mono">
            {isLiveSupabaseConfigured ? "Supabase Live" : "Supabase SSR Active"}
          </span>
        </button>

        {/* User Profile Mini Badge */}
        <button
          onClick={onOpenAuthModal}
          className="flex items-center gap-1.5 p-1 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          title={`Signed in as ${profile?.fullName || 'User'} (${profile?.companyName || 'ApexMed'})`}
        >
          <div className="w-7 h-7 rounded-full bg-[#0F2747] text-white text-xs font-semibold flex items-center justify-center">
            {profile?.avatarInitials || "AM"}
          </div>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-semibold text-[#0F2747]">Procurement Alerts</span>
                <span className="text-[10px] text-slate-400">3 unread</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded bg-slate-50 text-xs hover:bg-slate-100 transition-colors">
                    <div className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{n.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-[#2F80ED] font-medium hover:underline"
                >
                  Dismiss all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Call to Action: Import Tender */}
        <Button
          onClick={onOpenImportModal}
          size="sm"
          variant="primary"
          icon={<Plus className="w-3.5 h-3.5" />}
          className="shadow-xs font-semibold text-xs"
        >
          <span className="hidden sm:inline">Import Tender</span>
          <span className="sm:hidden">Import</span>
        </Button>
      </div>
    </header>
  );
}
