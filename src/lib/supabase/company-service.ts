import { CompanyProfile, CompanyProduct, CompanyCertification, PreviousProject } from "../../types/procurement";
import { supabaseBrowserClient, getSanitizedSupabaseConfig } from "./client";
import { procurementDb } from "../supabase";

const USER_SAVED_FLAG_KEY = "bidder_has_saved_custom_profile";

export function hasUserSavedCustomProfile(): boolean {
  try {
    return localStorage.getItem(USER_SAVED_FLAG_KEY) === "true";
  } catch {
    return false;
  }
}

export function setUserSavedCustomProfileFlag(): void {
  try {
    localStorage.setItem(USER_SAVED_FLAG_KEY, "true");
  } catch {}
}

export interface SaveProfileResult {
  success: boolean;
  savedToRemoteSupabase: boolean;
  error?: string;
}

/**
 * Saves company profile, products, certifications, and previous projects to Supabase.
 * Synchronizes with local store and ensures user's saved data is strictly preserved.
 */
export async function saveCompanyProfile(
  profile: CompanyProfile
): Promise<SaveProfileResult> {
  const { isLive } = getSanitizedSupabaseConfig();
  let savedToRemote = false;
  let remoteErrorMsg: string | undefined = undefined;

  // 1. If Supabase is live, attempt remote upsert
  if (isLive) {
    try {
      // Upsert company record
      const companyPayload = {
        id: profile.id,
        name: profile.name,
        business_type: profile.businessType,
        description: profile.description,
        location: profile.location,
        preferred_regions: profile.preferredRegions,
        min_contract_value: profile.minContractValue,
        max_contract_value: profile.maxContractValue,
        annual_contract_capacity: profile.annualContractCapacity,
        previous_projects: profile.previousProjects,
        legal_entity: profile.legalEntity || profile.name,
        updated_at: new Date().toISOString(),
      };

      const { error: companyError } = await supabaseBrowserClient
        .from("companies")
        .upsert(companyPayload, { onConflict: "id" });

      if (companyError) {
        console.warn("Supabase remote companies upsert info:", companyError.message);
        remoteErrorMsg = companyError.message;
      } else {
        savedToRemote = true;

        // Upsert products if table is present
        if (profile.products && profile.products.length > 0) {
          const productRows = profile.products.map((p, idx) => ({
            id: p.id && p.id.startsWith("prod-") ? undefined : p.id,
            company_id: profile.id,
            name: p.name,
            category: p.category,
            description: p.description,
            certifications: p.certifications,
          }));
          await supabaseBrowserClient.from("products").upsert(productRows);
        }

        // Upsert certifications if table is present
        if (profile.certifications && profile.certifications.length > 0) {
          const certRows = profile.certifications.map((c) => ({
            id: c.id && c.id.startsWith("cert-") ? undefined : c.id,
            company_id: profile.id,
            name: c.name,
            certificate_number: c.certificateNumber,
            issuing_body: c.issuingBody,
            issue_date: c.issueDate,
            expiry_date: c.expiryDate,
            status: c.status || "active",
          }));
          await supabaseBrowserClient.from("certifications").upsert(certRows);
        }
      }
    } catch (err: any) {
      console.warn("Supabase network sync notice:", err);
      remoteErrorMsg = err?.message;
    }
  }

  // 2. Commit to persistent store to guarantee that user-saved data is never lost or overwritten
  setUserSavedCustomProfileFlag();
  procurementDb.updateCompanyProfile(profile);

  return {
    success: true,
    savedToRemoteSupabase: savedToRemote,
    error: remoteErrorMsg,
  };
}

/**
 * Loads the current company profile from Supabase or persistent store.
 */
export async function loadCompanyProfile(): Promise<CompanyProfile> {
  const { isLive } = getSanitizedSupabaseConfig();

  if (isLive) {
    try {
      const { data: companyData, error } = await supabaseBrowserClient
        .from("companies")
        .select("*")
        .limit(1)
        .single();

      if (companyData && !error) {
        // Fetch related products
        const { data: productsData } = await supabaseBrowserClient
          .from("products")
          .select("*")
          .eq("company_id", companyData.id);

        // Fetch related certifications
        const { data: certsData } = await supabaseBrowserClient
          .from("certifications")
          .select("*")
          .eq("company_id", companyData.id);

        const loaded: CompanyProfile = {
          id: companyData.id,
          name: companyData.name,
          businessType: companyData.business_type || "Medical Equipment Supplier",
          description: companyData.description || companyData.capabilities_summary || "",
          location: companyData.location || companyData.headquarters || "",
          preferredRegions: companyData.preferred_regions || [],
          minContractValue: Number(companyData.min_contract_value) || 0,
          maxContractValue: Number(companyData.max_contract_value) || 0,
          annualContractCapacity: Number(companyData.annual_contract_capacity) || Number(companyData.annual_turnover) || 0,
          previousProjects: companyData.previous_projects || [],
          products: (productsData || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description || "",
            certifications: p.certifications || p.ce_mark_mdr_status || "",
          })),
          certifications: (certsData || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            certificateNumber: c.certificate_number,
            issuingBody: c.issuing_body || c.issuer || "",
            issueDate: c.issue_date || c.valid_from || "",
            expiryDate: c.expiry_date,
            status: c.status || "active",
          })),
        };

        // Cache locally
        procurementDb.updateCompanyProfile(loaded);
        return loaded;
      }
    } catch (err) {
      console.warn("Could not load from remote Supabase, falling back to persistent store:", err);
    }
  }

  return procurementDb.getCompanyProfile();
}
