import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  FileCheck2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Download,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Lock,
  ExternalLink,
  Plus,
  RefreshCw,
} from "lucide-react";
import { CompanyDocument, DocumentType, VerificationStatus } from "../../types/procurement";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { VerificationStatusBadge } from "../ui/StatusIndicator";
import {
  fetchCompanyDocuments,
  uploadDocument,
  deleteDocument,
  updateDocumentVerification,
  getSecureDocumentUrl,
} from "../../lib/supabase/document-service";
import { useAuth } from "../../lib/supabase/auth-context";

const DOCUMENT_TYPES: DocumentType[] = [
  "ISO certificates",
  "CE certificates",
  "commercial registration",
  "tax documents",
  "financial statements",
  "manufacturer authorizations",
  "previous contracts",
  "product catalogs",
  "other procurement documents",
];

const VERIFICATION_STATUSES: VerificationStatus[] = [
  "FOUND",
  "PENDING",
  "NEEDS_REVIEW",
  "EXPIRED",
];

export function DocumentsView() {
  const { profile } = useAuth();
  const companyId = profile?.companyId || "comp-apexmed-01";

  // Data state
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & search
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Drag and drop upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<DocumentType>("ISO certificates");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents
  const loadDocs = async () => {
    setIsLoading(true);
    const docs = await fetchCompanyDocuments(companyId);
    setDocuments(docs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDocs();
  }, [companyId]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleFileUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadFeedback(null);

    try {
      const result = await uploadDocument(
        file,
        uploadDocType,
        companyId,
        profile?.fullName || "Marcus Sterling",
        uploadNotes
      );

      if (result.success && result.document) {
        setUploadFeedback({
          type: "success",
          message: `Successfully uploaded ${file.name} to private Supabase Storage and registered in company_documents.`,
        });
        setUploadNotes("");
        await loadDocs();
      } else {
        setUploadFeedback({
          type: "error",
          message: result.error || "Failed to upload document to storage.",
        });
      }
    } catch (err: any) {
      setUploadFeedback({
        type: "error",
        message: err?.message || "Upload failed. Please try again.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Status update
  const handleStatusChange = async (id: string, newStatus: VerificationStatus) => {
    await updateDocumentVerification(id, newStatus);
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, verificationStatus: newStatus } : d))
    );
  };

  // Delete document
  const handleDelete = async (doc: CompanyDocument) => {
    if (confirm(`Remove ${doc.filename} from the company documents vault?`)) {
      await deleteDocument(doc.id, doc.storagePath);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    }
  };

  // Secure download
  const handleSecureDownload = async (doc: CompanyDocument) => {
    const url = await getSecureDocumentUrl(doc);
    if (url) {
      window.open(url, "_blank");
    } else {
      alert(
        `Downloading private document: ${doc.filename}\n(Verified via private Supabase Storage)`
      );
    }
  };

  // Filtering
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.filename.toLowerCase().includes(search.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(search.toLowerCase()) ||
      (doc.notes && doc.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedType === "All" || doc.documentType === selectedType;
    const matchesStatus =
      selectedStatus === "All" || doc.verificationStatus === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Verification Counts
  const countFound = documents.filter((d) => d.verificationStatus === "FOUND").length;
  const countPending = documents.filter((d) => d.verificationStatus === "PENDING").length;
  const countNeedsReview = documents.filter(
    (d) => d.verificationStatus === "NEEDS_REVIEW"
  ).length;
  const countExpired = documents.filter((d) => d.verificationStatus === "EXPIRED").length;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0F2747]">
            Company Documents & Procurement Evidence Vault
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store, verify, and cross-reference statutory certifications, catalogs, and contracts in private Supabase Storage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="font-medium">FOUND & VERIFIED</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-900 mt-1">{countFound} Files</div>
          <p className="text-[10px] text-emerald-700 mt-0.5">Ready for tender submissions</p>
        </div>

        <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between text-blue-800">
            <span className="font-medium">PENDING VERIFICATION</span>
            <span className="w-2 h-2 rounded-full bg-[#2F80ED] animate-pulse" />
          </div>
          <div className="text-xl font-bold text-blue-900 mt-1">{countPending} Files</div>
          <p className="text-[10px] text-blue-700 mt-0.5">Uploaded & awaiting audit check</p>
        </div>

        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-between text-amber-800">
            <span className="font-medium">NEEDS_REVIEW</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-900 mt-1">{countNeedsReview} Files</div>
          <p className="text-[10px] text-amber-700 mt-0.5">Annexes or updates required</p>
        </div>

        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200">
          <div className="flex items-center justify-between text-rose-800">
            <span className="font-medium">EXPIRED</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-900 mt-1">{countExpired} Files</div>
          <p className="text-[10px] text-rose-700 mt-0.5">Superseded / replace certificate</p>
        </div>
      </div>

      {/* Drag & Drop Upload Card */}
      <Card className="border-2 border-dashed transition-colors overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Left side: Drag Target */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 w-full rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-[#2F80ED] bg-blue-50/70"
                  : "border-slate-300 hover:border-[#2F80ED] bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                onChange={handleFileSelect}
              />

              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2F80ED] flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>

              <h3 className="text-sm font-bold text-[#0F2747]">
                Drag and drop procurement files here, or <span className="text-[#2F80ED]">browse</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports PDF, DOCX, XLSX, PNG (up to 50MB)
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Private Supabase Storage Bucket · Encrypted at Rest</span>
              </div>
            </div>

            {/* Right side: Classification & Notes */}
            <div className="w-full md:w-80 space-y-3 text-xs shrink-0">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Document Classification <span className="text-rose-500">*</span>
                </label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value as DocumentType)}
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Procurement Notes / Scope
                </label>
                <input
                  type="text"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="e.g. Valid through Nov 2026 for ICU lot"
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
                />
              </div>

              <div className="p-2.5 rounded bg-slate-100 text-[11px] text-slate-600 leading-snug">
                <span className="font-semibold text-slate-800">Private Vault Protection:</span>{" "}
                Documents are stored in a private bucket accessible only to authenticated SME members.
                Public access is strictly disabled.
              </div>
            </div>
          </div>

          {/* Upload Status Banner */}
          {isUploading && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Uploading to private Supabase Storage and recording in company_documents table...</span>
            </div>
          )}

          {uploadFeedback && (
            <div
              className={`p-3 rounded text-xs flex items-center justify-between gap-2 ${
                uploadFeedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {uploadFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{uploadFeedback.message}</span>
              </div>
              <button
                onClick={() => setUploadFeedback(null)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
              >
                Dismiss
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-3 text-xs">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename, document type, or notes..."
              className="w-full h-8 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2F80ED] focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-slate-400 text-[11px]">Filter Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-8 text-xs bg-slate-50 border border-slate-200 rounded px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
            >
              <option value="All">All Types ({documents.length})</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <span className="text-slate-400 text-[11px] ml-1">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 text-xs bg-slate-50 border border-slate-200 rounded px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
            >
              <option value="All">All Statuses</option>
              {VERIFICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-[#0F2747]">
              Company Document Vault
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredDocuments.length} of {documents.length} recorded documents
            </p>
          </div>
          <Button
            onClick={loadDocs}
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs text-slate-600"
          >
            Refresh Vault
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4">Access & Privacy</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No documents found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Filename */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded bg-blue-50 text-[#2F80ED] flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-sm">
                              {doc.filename}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{doc.fileSize}</span>
                              {doc.notes && (
                                <>
                                  <span>·</span>
                                  <span className="truncate max-w-xs">{doc.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Document Type */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 capitalize">
                        {doc.documentType}
                      </td>

                      {/* Upload Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {doc.uploadDate}
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <VerificationStatusBadge status={doc.verificationStatus} />
                          {/* Quick Status Adjuster */}
                          <select
                            value={doc.verificationStatus}
                            onChange={(e) =>
                              handleStatusChange(doc.id, e.target.value as VerificationStatus)
                            }
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 focus:outline-none"
                            title="Update verification status"
                          >
                            {VERIFICATION_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Access & Privacy */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                          <Lock className="w-3 h-3 text-slate-400" />
                          Private Bucket
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => handleSecureDownload(doc)}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 text-[#2F80ED] hover:text-[#256ecc]"
                            icon={<Download className="w-3 h-3" />}
                          >
                            Download
                          </Button>
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
