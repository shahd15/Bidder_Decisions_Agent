import React, { useState } from "react";
import {
  X,
  Calendar,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Clock,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Plus,
  Send,
  Download,
} from "lucide-react";
import { TenderOpportunity, RequirementItem, RiskItem } from "../../types/procurement";
import { formatFullCurrency, formatCurrency } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { BidDecisionBadge, RequirementStatusTag, RiskSeverityBadge, RecommendationBadge } from "../ui/StatusIndicator";
import { ScoreGauge, ScoreProgressBar } from "../ui/ScoreGauge";
import { procurementDb } from "../../lib/supabase";

interface TenderDetailModalProps {
  opportunity: TenderOpportunity | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: TenderOpportunity["status"]) => void;
  onOpenBidPackage: (opp: TenderOpportunity) => void;
  onAddTask: (opp: TenderOpportunity) => void;
}

export function TenderDetailModal({
  opportunity,
  onClose,
  onUpdateStatus,
  onOpenBidPackage,
  onAddTask,
}: TenderDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"specs" | "risks" | "scores" | "exclusion">("specs");

  if (!opportunity) return null;

  const handleDecisionAction = (newStatus: TenderOpportunity["status"]) => {
    onUpdateStatus(opportunity.id, newStatus);
  };

  return (
    <Modal
      isOpen={Boolean(opportunity)}
      onClose={onClose}
      title={`${opportunity.referenceCode} — Tender Qualification & Decision`}
      subtitle={opportunity.contractingAuthority}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Header Summary Strip */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-[#0F2747]">{opportunity.sector}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">CPV: {opportunity.cpvCode}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">{opportunity.country}</span>
            </div>
            <h2 className="text-base font-bold text-[#0F2747] leading-tight">
              {opportunity.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
              <span>
                Contract Value:{" "}
                <strong className="text-slate-800 font-semibold">
                  {formatFullCurrency(opportunity.contractValue, opportunity.currency)}
                </strong>
              </span>
              <span>·</span>
              <span>
                Duration:{" "}
                <strong className="text-slate-800">{opportunity.contractDurationMonths} Months</strong>
              </span>
              <span>·</span>
              <span>
                Submission:{" "}
                <strong className="text-slate-800">{opportunity.submissionDeadline}</strong> (
                {opportunity.daysRemaining} days left)
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
            {opportunity.decision ? (
              <BidDecisionBadge decision={opportunity.decision} />
            ) : (
              <RecommendationBadge recommendation={opportunity.recommendation} />
            )}
            <ScoreGauge score={opportunity.overallScore ?? 0} size="md" showLabel={true} />
          </div>
        </div>

        {/* AI Rationale Summary Callout */}
        <div className="p-3.5 rounded-lg bg-[#EBF3FE] border border-[#2F80ED]/30 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#0F2747] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#2F80ED]" />
            <span>AI Bid/No-Bid Executive Rationale</span>
          </div>
          <p className="text-slate-700 leading-relaxed">{opportunity.decisionRationale}</p>
        </div>

        {/* Tab Navigation (Segmented buttons) */}
        <div className="flex border-b border-slate-200 gap-1 text-xs">
          {[
            {
              id: "specs",
              label: `Extracted Requirements (${opportunity.requirements.length})`,
            },
            {
              id: "risks",
              label: `Identified Risks (${opportunity.risks.length})`,
            },
            {
              id: "scores",
              label: "Scorecard Breakdown (5 Pillars)",
            },
            {
              id: "exclusion",
              label: "Mandatory Exclusion Checks",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-3 font-medium transition-colors border-b-2 -mb-px text-xs ${
                activeTab === tab.id
                  ? "border-[#2F80ED] text-[#2F80ED] font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "specs" && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 flex justify-between items-center">
              <span>
                Requirements automatically extracted from tender specifications & schedules:
              </span>
              <span className="font-semibold text-slate-700">
                {
                  opportunity.requirements.filter((r) => r.companyMatchStatus === "compliant")
                    .length
                }{" "}
                of {opportunity.requirements.length} Fully Compliant
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
              {opportunity.requirements.map((req, i) => (
                <div key={req.id || i} className="p-3.5 bg-white hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">
                          {req.category}
                        </span>
                        {req.mandatory && (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-1 py-0.2 rounded">
                            MANDATORY PASS/FAIL
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-slate-800 leading-snug">{req.text}</p>
                      {req.matchingEvidence && (
                        <p className="text-[11px] text-emerald-800 bg-emerald-50/60 rounded p-1.5 border border-emerald-100 mt-1">
                          <strong className="font-semibold">Company Evidence Match: </strong>
                          {req.matchingEvidence}
                        </p>
                      )}
                      {req.notes && (
                        <p className="text-[11px] text-amber-800 bg-amber-50/60 rounded p-1.5 border border-amber-100 mt-1">
                          <strong className="font-semibold">Gap Note: </strong>
                          {req.notes}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 pt-0.5">
                      <RequirementStatusTag status={req.companyMatchStatus} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "risks" && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              Procurement and commercial risks identified by AI comparison:
            </div>

            {opportunity.risks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                No critical or warning risks identified for this tender.
              </div>
            ) : (
              <div className="space-y-2.5">
                {opportunity.risks.map((risk) => (
                  <div
                    key={risk.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RiskSeverityBadge severity={risk.severity} />
                        <span className="font-bold text-slate-800">{risk.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-rose-600 font-semibold">
                        Score impact: {risk.impactScore} pts
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs">{risk.description}</p>

                    <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                      <strong className="text-[#0F2747]">Action / Mitigation Strategy: </strong>
                      {risk.mitigationStrategy}
                      {risk.owner && (
                        <span className="text-slate-400 ml-2">· Assigned: {risk.owner}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "scores" && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500">
              5-Pillar weighted scoring methodology calibrated for UK & EU healthcare tenders:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <ScoreProgressBar
                  label="1. Technical Capability & Product Specs"
                  score={opportunity.scoresBreakdown?.technicalCapability ?? 0}
                  weight="30%"
                />
                <ScoreProgressBar
                  label="2. Regulatory Certifications & MDR"
                  score={opportunity.scoresBreakdown?.regulatoryCompliance ?? 0}
                  weight="25%"
                />
                <ScoreProgressBar
                  label="3. Commercial Viability & Pricing Margin"
                  score={opportunity.scoresBreakdown?.commercialViability ?? 0}
                  weight="20%"
                />
                <ScoreProgressBar
                  label="4. Past Performance & Clinical References"
                  score={opportunity.scoresBreakdown?.pastPerformance ?? 0}
                  weight="15%"
                />
                <ScoreProgressBar
                  label="5. Delivery SLA & 24/7 Biomedical Support"
                  score={opportunity.scoresBreakdown?.deliveryCapacity ?? 0}
                  weight="10%"
                />
              </div>

              <div className="p-4 rounded-lg bg-white border border-slate-200 text-xs space-y-3">
                <h4 className="font-bold text-[#0F2747]">Why this score was generated:</h4>
                <ul className="space-y-2 text-slate-600 list-disc list-inside">
                  <li>
                    <strong>Technical:</strong> In-stock medical devices meet or exceed high-flow
                    delivery parameters.
                  </li>
                  <li>
                    <strong>Regulatory:</strong> Notified Body CE Mark (BSI/TÜV SÜD) is active with
                    no outstanding audit actions.
                  </li>
                  <li>
                    <strong>Capacity:</strong> Field engineering hubs cover required geographic SLA
                    radius.
                  </li>
                  <li>
                    <strong>Social Value:</strong> Net zero PPN 06/21 plan requires final carbon
                    sign-off.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "exclusion" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800">
              <div className="flex items-center gap-2 font-bold mb-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mandatory Public Procurement Exclusion Grounds Passed</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                ApexMed Healthcare Solutions Ltd has verified status under Public Contracts
                Regulations 2015 (PCR 2015 Reg 57) and the European Single Procurement Document
                (ESPD).
              </p>
            </div>

            <div className="border border-slate-200 rounded divide-y divide-slate-100">
              <div className="p-2.5 flex items-center justify-between">
                <span>Criminal Convictions & Fraud Checks (Reg 57(1))</span>
                <span className="font-semibold text-emerald-700">Clear / Verified</span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span>HMRC Tax & Social Security Compliance (Reg 57(3))</span>
                <span className="font-semibold text-emerald-700">Up to Date</span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span>Modern Slavery & Child Labor Statement (MSA 2015)</span>
                <span className="font-semibold text-emerald-700">Published 2026</span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span>NHS DSPT Data Security Standards Met</span>
                <span className="font-semibold text-emerald-700">Level 3 Standards Met</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onAddTask(opportunity)}
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Action Plan Task
            </Button>
            <Button
              onClick={() => onOpenBidPackage(opportunity)}
              variant="outline"
              size="sm"
              icon={<Briefcase className="w-3.5 h-3.5" />}
            >
              View Draft Bid Package
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {opportunity.status !== "bid_approved" && (
              <Button
                onClick={() => handleDecisionAction("bid_approved")}
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Approve Bid
              </Button>
            )}
            {opportunity.status !== "bid_declined" && (
              <Button
                onClick={() => handleDecisionAction("bid_declined")}
                variant="outline"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                Decline / Mark No-Bid
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" size="sm">
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
