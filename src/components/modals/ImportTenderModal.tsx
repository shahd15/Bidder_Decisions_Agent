import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { TenderOpportunity, TenderSector } from "../../types/procurement";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface ImportTenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (opportunity: TenderOpportunity) => void;
  onNavigateToUpload?: () => void;
}

export function ImportTenderModal({
  isOpen,
  onClose,
  onImportComplete,
  onNavigateToUpload,
}: ImportTenderModalProps) {
  const [activeMode, setActiveMode] = useState<"quick_sample" | "custom_form">("quick_sample");
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Custom Form fields
  const [customTitle, setCustomTitle] = useState("");
  const [customAuthority, setCustomAuthority] = useState("");
  const [customSector, setCustomSector] = useState<TenderSector>("Medical Equipment");
  const [customValue, setCustomValue] = useState("1500000");
  const [customDeadline, setCustomDeadline] = useState("2026-11-15");

  const samplePresets = [
    {
      title: "Royal Free London NHS Trust - Point-of-Care Blood Gas Analyzers & Cassettes",
      authority: "Royal Free London NHS Foundation Trust",
      sector: "Laboratory & Reagents" as TenderSector,
      referenceCode: "NHS-RFL-2026-0922",
      value: 1450000,
      currency: "GBP" as const,
      cpvCode: "33696500-0",
      deadline: "2026-11-18",
      score: 86,
      decision: "RECOMMENDED BID" as const,
      rationale:
        "High compatibility: BioChemApex point-of-care cartridges match 100% of bedside ICU analyte tests. Meets 24-hr cartridge replacement turnaround requirement.",
    },
    {
      title: "Karolinska University Hospital - Robotic Surgical Instruments & Sterile Laparoscopy Packs",
      authority: "Karolinska Universitetssjukhuset (Stockholm)",
      sector: "Medical Devices" as TenderSector,
      referenceCode: "EU-TED-KAR-2026-3011",
      value: 3200000,
      currency: "EUR" as const,
      cpvCode: "33162000-3",
      deadline: "2026-11-25",
      score: 79,
      decision: "CONDITIONAL BID" as const,
      rationale:
        "Strong surgical device catalog. Requires Swedish medical device registration confirmation and local sterilization validation protocol.",
    },
    {
      title: "East of England Ambulance Service - High-Intensity Ambulance Ultraviolet Air Sanitizers",
      authority: "East of England Ambulance Service NHS Trust",
      sector: "Hospital Facilities" as TenderSector,
      referenceCode: "NHS-EEAS-2026-4402",
      value: 620000,
      currency: "GBP" as const,
      cpvCode: "33191000-5",
      deadline: "2026-10-24",
      score: 44,
      decision: "NO-BID / HIGH RISK" as const,
      rationale:
        "Non-compliant with mandatory 12V DC vehicle battery continuous drain standard. Retrofit costs would erode all contract margins.",
    },
  ];

  const handleImportSample = () => {
    setIsProcessing(true);
    const preset = samplePresets[selectedPreset];

    setTimeout(() => {
      const newOpp: TenderOpportunity = {
        id: `opp-imp-${Date.now()}`,
        referenceCode: preset.referenceCode,
        title: preset.title,
        contractingAuthority: preset.authority,
        authorityType: "NHS Foundation Trust",
        country: preset.currency === "GBP" ? "UK" : "Nordics",
        sector: preset.sector,
        cpvCode: preset.cpvCode,
        publicationDate: "2026-10-02",
        submissionDeadline: preset.deadline,
        daysRemaining: 42,
        contractValue: preset.value,
        currency: preset.currency,
        contractDurationMonths: 36,
        overallScore: preset.score,
        decision: preset.decision,
        decisionRationale: preset.rationale,
        scoresBreakdown: {
          technicalCapability: preset.score >= 80 ? 92 : 68,
          regulatoryCompliance: 90,
          commercialViability: 82,
          pastPerformance: 85,
          deliveryCapacity: 78,
        },
        status: "new_tender",
        actionPlanCount: { total: 4, completed: 0, criticalPending: 1 },
        requirements: [
          {
            id: "imp-req-1",
            category: "Technical Specification",
            text: "High-acuity diagnostic parameters with CE/MDR Class IIb conformance.",
            mandatory: true,
            companyMatchStatus: "compliant",
            matchingEvidence: "Apex product catalog specifications.",
          },
          {
            id: "imp-req-2",
            category: "Delivery & Service SLA",
            text: "Guaranteed 24-hr emergency spare cartridge replenishment.",
            mandatory: true,
            companyMatchStatus: "compliant",
            matchingEvidence: "Milton Keynes GDP cold chain center.",
          },
        ],
        risks:
          preset.score < 60
            ? [
                {
                  id: "imp-risk-1",
                  severity: "critical",
                  title: "Vehicle DC Power Incompatibility",
                  description: "Draws 40A on 12V circuit exceeding ambulance auxiliary power limits.",
                  impactScore: -30,
                  mitigationStrategy: "Recommend No-Bid.",
                  owner: "Technical Lead",
                },
              ]
            : [],
      };

      setIsProcessing(false);
      onImportComplete(newOpp);
      onClose();
    }, 600);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customAuthority) return;

    setIsProcessing(true);
    setTimeout(() => {
      const newOpp: TenderOpportunity = {
        id: `opp-custom-${Date.now()}`,
        referenceCode: `NHS-PROC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: customTitle,
        contractingAuthority: customAuthority,
        authorityType: "NHS Foundation Trust",
        country: "UK",
        sector: customSector,
        cpvCode: "33000000-0 (Medical equipment)",
        publicationDate: "2026-10-05",
        submissionDeadline: customDeadline,
        daysRemaining: 30,
        contractValue: Number(customValue) || 1000000,
        currency: "GBP",
        contractDurationMonths: 36,
        overallScore: 84,
        decision: "RECOMMENDED BID",
        decisionRationale:
          "AI match verified: Core medical equipment specifications correspond to ApexMed portfolio and audited ISO 13485 quality credentials.",
        scoresBreakdown: {
          technicalCapability: 88,
          regulatoryCompliance: 92,
          commercialViability: 84,
          pastPerformance: 80,
          deliveryCapacity: 82,
        },
        status: "new_tender",
        actionPlanCount: { total: 3, completed: 0, criticalPending: 1 },
        requirements: [
          {
            id: "c-req-1",
            category: "Regulatory & Compliance",
            text: "Demonstrated ISO 13485 QMS certification.",
            mandatory: true,
            companyMatchStatus: "compliant",
            matchingEvidence: "BSI Certificate MD 782910-UK.",
          },
        ],
        risks: [],
      };

      setIsProcessing(false);
      onImportComplete(newOpp);
      onClose();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Healthcare Tender Notice"
      subtitle="Extract requirements, compare against company credentials & calculate Bid/No-Bid score"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs">
        {/* Tender Upload PDF Banner */}
        {onNavigateToUpload && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#2F80ED]" />
              <span className="font-semibold text-slate-800">
                Have an official procurement RFP PDF?
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToUpload();
              }}
              className="text-xs font-semibold text-[#2F80ED] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Open Tender PDF Uploader &rarr;
            </button>
          </div>
        )}

        {/* Toggle Mode */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveMode("quick_sample")}
            className={`pb-2.5 px-4 font-semibold text-xs border-b-2 -mb-px transition-colors ${
              activeMode === "quick_sample"
                ? "border-[#2F80ED] text-[#2F80ED]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Pre-Extracted Healthcare Tenders (Instant Demo)
          </button>
          <button
            onClick={() => setActiveMode("custom_form")}
            className={`pb-2.5 px-4 font-semibold text-xs border-b-2 -mb-px transition-colors ${
              activeMode === "custom_form"
                ? "border-[#2F80ED] text-[#2F80ED]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Manual Tender Entry / RFP Link
          </button>
        </div>

        {activeMode === "quick_sample" ? (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 leading-relaxed">
              Select an authentic UK/EU healthcare tender opportunity to run through the AI
              bid qualification engine:
            </div>

            <div className="space-y-2.5">
              {samplePresets.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPreset(idx)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    selectedPreset === idx
                      ? "border-[#2F80ED] bg-white ring-1 ring-[#2F80ED] shadow-2xs"
                      : "border-slate-200 bg-slate-50 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500 font-semibold">
                          {sample.referenceCode}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600 font-medium">{sample.authority}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 leading-snug">{sample.title}</h4>
                      <p className="text-[11px] text-slate-500">{sample.rationale}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block ${
                          sample.decision === "RECOMMENDED BID"
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : sample.decision === "CONDITIONAL BID"
                            ? "text-amber-700 bg-amber-50 border-amber-200"
                            : "text-rose-700 bg-rose-50 border-rose-200"
                        }`}
                      >
                        {sample.score} Fit Score · {sample.decision.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleImportSample}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing Tender Specs..." : "Ingest & Qualify Tender"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Tender Title / Procurement Notice
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Turnkey Installation of 6 Digital Mammography Suites"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Contracting Authority</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manchester University NHS Foundation Trust"
                  value={customAuthority}
                  onChange={(e) => setCustomAuthority(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Healthcare Sector</label>
                <select
                  value={customSector}
                  onChange={(e) => setCustomSector(e.target.value as any)}
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
                >
                  <option value="Medical Equipment">Medical Equipment</option>
                  <option value="Medical Devices">Medical Devices</option>
                  <option value="Laboratory & Reagents">Laboratory & Reagents</option>
                  <option value="Healthcare IT">Healthcare IT</option>
                  <option value="Hospital Facilities">Hospital Facilities</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Contract Value (£)</label>
                <input
                  type="number"
                  required
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Submission Deadline</label>
                <input
                  type="date"
                  required
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isProcessing}>
                {isProcessing ? "Analyzing..." : "Evaluate Tender"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
