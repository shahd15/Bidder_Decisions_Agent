import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  TenderOpportunity,
  CompanyProfile,
  ComplianceCertificate,
  ProcurementTask,
  BidPackage,
} from "../types/procurement";
import {
  initialCompanyProfile,
  initialComplianceCertificates,
  initialOpportunities,
  initialTasks,
  initialBidPackages,
} from "../data/mockData";
import { getSanitizedSupabaseConfig } from "./supabase/client";

const { url: supabaseUrl, key: supabaseAnonKey, isLive: isSupabaseConfigured } =
  getSanitizedSupabaseConfig();

export { isSupabaseConfigured };

// Optional live Supabase client if user has provided credentials
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local persistent store layer simulating Supabase tables
const STORAGE_PREFIX = "bidder_decisions_";

function getStoredItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.warn("Local storage write error:", err);
  }
}

export const procurementDb = {
  // Opportunities
  getOpportunities: (): TenderOpportunity[] => {
    return getStoredItem("opportunities", initialOpportunities);
  },
  saveOpportunities: (items: TenderOpportunity[]): void => {
    setStoredItem("opportunities", items);
  },
  getOpportunityById: (id: string): TenderOpportunity | undefined => {
    const list = procurementDb.getOpportunities();
    return list.find((o) => o.id === id);
  },
  updateOpportunityStatus: (id: string, status: TenderOpportunity["status"]): void => {
    const list = procurementDb.getOpportunities();
    const index = list.findIndex((o) => o.id === id);
    if (index !== -1) {
      list[index].status = status;
      procurementDb.saveOpportunities(list);
    }
  },
  addOpportunity: (opp: TenderOpportunity): void => {
    const list = procurementDb.getOpportunities();
    list.unshift(opp);
    procurementDb.saveOpportunities(list);
  },

  // Company Profile
  getCompanyProfile: (): CompanyProfile => {
    return getStoredItem("company_profile", initialCompanyProfile);
  },
  updateCompanyProfile: (profile: CompanyProfile): void => {
    setStoredItem("company_profile", profile);
  },

  // Compliance Certificates
  getCertificates: (): ComplianceCertificate[] => {
    return getStoredItem("compliance_certs", initialComplianceCertificates);
  },
  saveCertificates: (certs: ComplianceCertificate[]): void => {
    setStoredItem("compliance_certs", certs);
  },
  addCertificate: (cert: ComplianceCertificate): void => {
    const list = procurementDb.getCertificates();
    list.unshift(cert);
    procurementDb.saveCertificates(list);
  },

  // Tasks
  getTasks: (): ProcurementTask[] => {
    return getStoredItem("procurement_tasks", initialTasks);
  },
  saveTasks: (tasks: ProcurementTask[]): void => {
    setStoredItem("procurement_tasks", tasks);
  },
  toggleTask: (id: string): void => {
    const list = procurementDb.getTasks();
    const task = list.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      procurementDb.saveTasks(list);
    }
  },
  addTask: (task: ProcurementTask): void => {
    const list = procurementDb.getTasks();
    list.unshift(task);
    procurementDb.saveTasks(list);
  },

  // Bid Packages
  getBidPackages: (): BidPackage[] => {
    return getStoredItem("bid_packages", initialBidPackages);
  },
  saveBidPackages: (pkgs: BidPackage[]): void => {
    setStoredItem("bid_packages", pkgs);
  },
  getBidPackageById: (id: string): BidPackage | undefined => {
    const list = procurementDb.getBidPackages();
    return list.find((p) => p.id === id);
  },

  // Reset to initial
  resetDemoData: (): void => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + "opportunities");
      localStorage.removeItem(STORAGE_PREFIX + "company_profile");
      localStorage.removeItem(STORAGE_PREFIX + "compliance_certs");
      localStorage.removeItem(STORAGE_PREFIX + "procurement_tasks");
      localStorage.removeItem(STORAGE_PREFIX + "bid_packages");
    } catch {}
  },
};
