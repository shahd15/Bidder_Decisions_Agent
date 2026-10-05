import React, { useState } from "react";
import {
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Copy,
  ChevronRight,
  Sparkles,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { BidPackage, BidPackageSection } from "../../types/procurement";
import { formatFullCurrency } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";

interface BidPackagesViewProps {
  bidPackages: BidPackage[];
}

export function BidPackagesView({ bidPackages }: BidPackagesViewProps) {
  const [selectedPackage, setSelectedPackage] = useState<BidPackage>(bidPackages[0] || null);
  const [selectedSection, setSelectedSection] = useState<BidPackageSection | null>(
    bidPackages[0]?.sections[0] || null
  );
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleSelectPackage = (pkg: BidPackage) => {
    setSelectedPackage(pkg);
    setSelectedSection(pkg.sections[0] || null);
  };

  const handleCopySnippet = () => {
    if (selectedSection?.previewSnippet) {
      navigator.clipboard.writeText(selectedSection.previewSnippet);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0F2747]">
            First-Draft Tender Submission Packages
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated tender response schedules, clinical compliance matrices & commercial proposals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              window.print();
            }}
            variant="outline"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Dossier
          </Button>
          <Button
            onClick={() => {
              alert(
                `Exporting complete submission dossier for ${selectedPackage?.opportunityRef} (All technical schedules, pricing models, and MDR evidence certificates assembled into standard NHS portal ZIP archive).`
              );
            }}
            variant="primary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Submission Package
          </Button>
        </div>
      </div>

      {/* Package Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bidPackages.map((pkg) => {
          const isSelected = selectedPackage?.id === pkg.id;
          return (
            <div
              key={pkg.id}
              onClick={() => handleSelectPackage(pkg)}
              className={`p-4 rounded-xl border transition-all cursor-pointer bg-white text-xs ${
                isSelected
                  ? "border-[#2F80ED] ring-2 ring-[#2F80ED]/20 shadow-xs"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500 font-bold">
                      {pkg.opportunityRef}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      {pkg.complianceScore}% Compliance
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#0F2747]">{pkg.opportunityTitle}</h3>
                  <p className="text-slate-500 text-[11px]">{pkg.contractingAuthority}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-sm text-[#0F2747]">
                    {formatFullCurrency(pkg.contractValue, pkg.currency)}
                  </div>
                  <span className="text-[10px] text-slate-400">Deadline: {pkg.submissionDeadline}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Draft Progress</span>
                    <span className="font-semibold text-slate-700">{pkg.completionPercentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2F80ED] rounded-full transition-all"
                      style={{ width: `${pkg.completionPercentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-500 shrink-0 font-medium">
                  {pkg.version}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Package Detailed Sections Viewer */}
      {selectedPackage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section navigation (Left 4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Submission Response Sections
            </h3>

            <div className="space-y-1.5">
              {selectedPackage.sections.map((sec) => {
                const isSecSelected = selectedSection?.id === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSection(sec)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex flex-col gap-1 ${
                      isSecSelected
                        ? "bg-[#0F2747] text-white border-[#0F2747] shadow-xs"
                        : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="truncate">{sec.title}</span>
                      {sec.status === "complete" ? (
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSecSelected ? "text-emerald-400" : "text-emerald-600"
                          }`}
                        />
                      ) : (
                        <Clock
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSecSelected ? "text-amber-300" : "text-amber-500"
                          }`}
                        />
                      )}
                    </div>
                    <div
                      className={`flex items-center justify-between text-[11px] ${
                        isSecSelected ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      <span>
                        {sec.wordCountCurrent} / {sec.wordCountTarget} words
                      </span>
                      <span className="capitalize">{sec.status.replace("_", " ")}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section preview & drafting inspector (Right 8 cols) */}
          <div className="lg:col-span-8">
            {selectedSection ? (
              <Card className="h-full flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-bold text-[#0F2747]">
                          {selectedSection.title}
                        </CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {selectedSection.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleCopySnippet}
                          variant="outline"
                          size="sm"
                          icon={<Copy className="w-3.5 h-3.5" />}
                        >
                          {copyFeedback ? "Copied!" : "Copy Text"}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Lead Editor: <strong>{selectedSection.lastEditedBy}</strong>
                      </span>
                      <span>Last Updated: {selectedSection.lastEditedDate}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4 text-xs">
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-serif text-slate-800 leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedSection.previewSnippet}
                    </div>

                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded text-xs space-y-1">
                      <span className="font-semibold text-blue-900">
                        Procurement Compliance Check:
                      </span>
                      <p className="text-blue-800 text-[11px]">
                        Cross-referenced against contracting authority specification schedules and
                        verified against ApexMed ISO 13485 QMS audit documentation.
                      </p>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-lg flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Evaluation Score Target: 95%+ in technical scoring category</span>
                  </div>
                  <span className="font-mono text-[11px]">Draft v1.4 Locked</span>
                </div>
              </Card>
            ) : (
              <div className="h-64 flex items-center justify-center p-8 bg-white rounded-lg border border-slate-200 text-xs text-slate-400">
                Select a section to view draft content
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
