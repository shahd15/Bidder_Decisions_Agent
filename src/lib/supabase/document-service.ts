import { CompanyDocument, DocumentType, VerificationStatus } from "../../types/procurement";
import { supabaseBrowserClient, getSanitizedSupabaseConfig } from "./client";
import { initialCompanyDocuments } from "../../data/mockData";

const STORAGE_KEY = "bidder_company_documents";
const BUCKET_NAME = "company-documents";

function getStoredDocs(): CompanyDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : initialCompanyDocuments;
  } catch {
    return initialCompanyDocuments;
  }
}

function saveStoredDocs(docs: CompanyDocument[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.warn("Local storage write error:", err);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Fetches company documents from Supabase (or local persistent store)
 */
export async function fetchCompanyDocuments(companyId?: string): Promise<CompanyDocument[]> {
  const { isLive } = getSanitizedSupabaseConfig();

  if (isLive) {
    try {
      let query = supabaseBrowserClient
        .from("company_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const mapped: CompanyDocument[] = data.map((d: any) => ({
          id: d.id,
          companyId: d.company_id,
          filename: d.filename || d.name,
          documentType: d.document_type as DocumentType,
          uploadDate: d.uploaded_at ? d.uploaded_at.split("T")[0] : d.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          fileSize: d.file_size || "1.2 MB",
          verificationStatus: (d.verification_status || "PENDING") as VerificationStatus,
          storagePath: d.storage_path || d.file_url,
          fileUrl: d.file_url,
          uploadedBy: d.uploaded_by || "Authorized Staff",
          notes: d.notes,
        }));
        saveStoredDocs(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Could not fetch remote company_documents:", err);
    }
  }

  return getStoredDocs();
}

/**
 * Uploads document to Supabase Storage private bucket and stores metadata in company_documents table
 */
export async function uploadDocument(
  file: File,
  documentType: DocumentType,
  companyId: string,
  uploadedBy: string = "Marcus Sterling",
  notes?: string
): Promise<{ success: boolean; document?: CompanyDocument; error?: string }> {
  const { isLive } = getSanitizedSupabaseConfig();
  const fileExt = file.name.split(".").pop();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${companyId}/${documentType.replace(/\s+/g, "_")}/${Date.now()}_${sanitizedName}`;

  let remoteSuccess = false;
  let remoteFileUrl: string | undefined = undefined;

  // 1. Upload to Supabase Storage if live
  if (isLive) {
    try {
      const { data: uploadData, error: uploadError } = await supabaseBrowserClient.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        remoteSuccess = true;
        // Private bucket: create a secure signed URL with 1-hour expiration
        const { data: signedData } = await supabaseBrowserClient.storage
          .from(BUCKET_NAME)
          .createSignedUrl(storagePath, 3600);

        remoteFileUrl = signedData?.signedUrl;

        // Insert metadata row into company_documents table
        await supabaseBrowserClient.from("company_documents").insert({
          company_id: companyId,
          filename: file.name,
          name: file.name,
          document_type: documentType,
          file_url: remoteFileUrl || storagePath,
          storage_path: storagePath,
          file_size: formatBytes(file.size),
          verification_status: "PENDING",
          notes: notes || `Uploaded via procurement vault for ${documentType}`,
        });
      } else {
        console.warn("Supabase Storage upload warning (fallback enabled):", uploadError?.message);
      }
    } catch (err) {
      console.warn("Supabase upload exception:", err);
    }
  }

  // 2. Create reliable local document record
  const newDoc: CompanyDocument = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    companyId,
    filename: file.name,
    documentType,
    uploadDate: new Date().toISOString().split("T")[0],
    fileSize: formatBytes(file.size),
    verificationStatus: "PENDING",
    storagePath,
    fileUrl: remoteFileUrl,
    uploadedBy,
    notes: notes || `Direct upload: ${documentType}`,
  };

  const existing = getStoredDocs();
  const updated = [newDoc, ...existing];
  saveStoredDocs(updated);

  return {
    success: true,
    document: newDoc,
  };
}

/**
 * Updates document verification status (FOUND, PENDING, EXPIRED, NEEDS_REVIEW)
 */
export async function updateDocumentVerification(
  id: string,
  newStatus: VerificationStatus
): Promise<void> {
  const { isLive } = getSanitizedSupabaseConfig();

  if (isLive) {
    try {
      await supabaseBrowserClient
        .from("company_documents")
        .update({ verification_status: newStatus })
        .eq("id", id);
    } catch (err) {
      console.warn("Remote status update error:", err);
    }
  }

  const docs = getStoredDocs();
  const item = docs.find((d) => d.id === id);
  if (item) {
    item.verificationStatus = newStatus;
    saveStoredDocs(docs);
  }
}

/**
 * Removes a document record and deletes from Supabase storage
 */
export async function deleteDocument(id: string, storagePath?: string): Promise<void> {
  const { isLive } = getSanitizedSupabaseConfig();

  if (isLive && storagePath) {
    try {
      await supabaseBrowserClient.storage.from(BUCKET_NAME).remove([storagePath]);
      await supabaseBrowserClient.from("company_documents").delete().eq("id", id);
    } catch (err) {
      console.warn("Remote delete warning:", err);
    }
  }

  const docs = getStoredDocs().filter((d) => d.id !== id);
  saveStoredDocs(docs);
}

/**
 * Securely downloads or gets a private signed URL without exposing documents publicly
 */
export async function getSecureDocumentUrl(doc: CompanyDocument): Promise<string | null> {
  const { isLive } = getSanitizedSupabaseConfig();

  if (isLive && doc.storagePath) {
    try {
      const { data } = await supabaseBrowserClient.storage
        .from(BUCKET_NAME)
        .createSignedUrl(doc.storagePath, 3600); // 1-hour private signed link

      if (data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (err) {
      console.warn("Signed URL generation warning:", err);
    }
  }

  return doc.fileUrl || null;
}
