import React, { useState } from "react";
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  FileCheck2,
  Calendar,
  CheckCircle2,
  Plus,
  Download,
  ExternalLink,
  Search,
  FileText,
  Clock,
} from "lucide-react";
import { ComplianceCertificate, TenderSector } from "../../types/procurement";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface ComplianceViewProps {
  certificates: ComplianceCertificate[];
  onAddCertificate: (cert: ComplianceCertificate) => void;
}

export function ComplianceView({ certificates, onAddCertificate }: ComplianceViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCert, setNewCert] = useState<Partial<ComplianceCertificate>>({
    name: "",
    standard: "",
    issuer: "",
    certificateNumber: "",
    validFrom: "2026-01-01",
    expiryDate: "2027-01-01",
    status: "active",
    applicableSectors: ["Medical Equipment"],
    fileSize: "1.5 MB",
    verifiedByAudit: true,
  });

  const filteredCerts = certificates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.standard.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.issuer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.name || !newCert.standard) return;

    onAddCertificate({
      id: `cert-${Date.now()}`,
      name: newCert.name || "",
      standard: newCert.standard || "",
      issuer: newCert.issuer || "Accredited Body",
      certificateNumber: newCert.certificateNumber || "GB-CERT-2026",
      validFrom: newCert.validFrom || "2026-01-01",
      expiryDate: newCert.expiryDate || "2027-01-01",
      status: "active",
      applicableSectors: (newCert.applicableSectors as TenderSector[]) || ["Medical Equipment"],
      fileSize: "2.1 MB",
      verifiedByAudit: true,
    });

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0F2747]">
            Regulatory Evidence Vault & Quality Standards
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified certifications required for healthcare tender qualification (ISO, MDR, DSPT, GDP)
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Certificate
        </Button>
      </div>

      {/* Expiry Warning Callout */}
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200/90 text-xs flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-900">
            Upcoming Renewal Notice: NHS DSPT Toolkit 2025/2026
          </span>
          <p className="text-amber-800 leading-relaxed">
            The NHS Data Security and Protection Toolkit submission window closes on 30 June 2026.
            Bidding on NHS Digital/Healthcare IT lots requires active submission confirmation.
          </p>
        </div>
      </div>

      {/* Search and Vault Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search certificates, standards, or issuers..."
              className="w-full h-8 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredCerts.length} Certified Documents
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCerts.map((cert) => (
            <Card key={cert.id} className="hover:border-slate-300 transition-all flex flex-col justify-between">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-8 h-8 rounded-md bg-blue-50 text-[#2F80ED] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  {cert.status === "active" ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active / Verified
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <Clock className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Expiring Soon
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-[#0F2747] leading-snug line-clamp-2">
                    {cert.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {cert.standard}
                  </p>
                </div>

                <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Issuer:</span>
                    <span className="font-medium text-slate-800 text-right truncate max-w-[160px]">
                      {cert.issuer}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cert #:</span>
                    <span className="font-mono text-slate-700">{cert.certificateNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expiry Date:</span>
                    <span
                      className={`font-semibold ${
                        cert.status === "expiring_soon" ? "text-amber-600" : "text-slate-700"
                      }`}
                    >
                      {cert.expiryDate}
                    </span>
                  </div>
                </div>
              </CardContent>

              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 rounded-b-lg">
                <span>PDF · {cert.fileSize}</span>
                <span className="text-[#2F80ED] font-semibold hover:underline cursor-pointer flex items-center gap-1">
                  Download Proof
                  <Download className="w-3 h-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Mandatory Exclusion Grounds Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[#0F2747]">
            Statutory Public Procurement Exclusion Ground Matrix
          </CardTitle>
          <p className="text-xs text-slate-500">
            Enforced under Regulation 57 of the Public Contracts Regulations 2015 & European Single Procurement Document (ESPD)
          </p>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
            <div className="p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Section 1: Mandatory Criminal & Corruption Checks</span>
                <p className="text-[11px] text-slate-500">Bribery Act 2010, corporate manslaughter, money laundering</p>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                100% PASS
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Section 2: Tax Evasion & HMRC Compliance</span>
                <p className="text-[11px] text-slate-500">Full corporation tax and PAYE clearance certs filed</p>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                VERIFIED
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Section 3: Environmental & PPN 06/21 Net Zero Plan</span>
                <p className="text-[11px] text-slate-500">Scope 1 & 2 audited; Scope 3 transport annex under scheduled review</p>
              </div>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                ACTION PENDING
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Certificate Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Upload Quality Certificate or Regulatory Approval"
        subtitle="Ensure validity dates match official Notified Body certificates"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Certificate Name</label>
            <input
              type="text"
              required
              placeholder="e.g. ISO 14001:2015 Environmental Management"
              value={newCert.name}
              onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
              className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Standard / Code</label>
              <input
                type="text"
                required
                placeholder="e.g. ISO 14001"
                value={newCert.standard}
                onChange={(e) => setNewCert({ ...newCert, standard: e.target.value })}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Issuer / Notified Body</label>
              <input
                type="text"
                placeholder="e.g. BSI Group / TÜV SÜD"
                value={newCert.issuer}
                onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Certificate Reference #</label>
              <input
                type="text"
                placeholder="e.g. MD 912803"
                value={newCert.certificateNumber}
                onChange={(e) => setNewCert({ ...newCert, certificateNumber: e.target.value })}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Expiry Date</label>
              <input
                type="date"
                required
                value={newCert.expiryDate}
                onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save to Evidence Vault
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
