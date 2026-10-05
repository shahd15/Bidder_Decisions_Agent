import React from "react";
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Activity,
  Award,
  Calendar,
} from "lucide-react";
import {
  TenderOpportunity,
  ProcurementTask,
  ComplianceCertificate,
  BidPackage,
} from "../../types/procurement";
import { formatCurrency, formatFullCurrency } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { BidDecisionBadge, RiskSeverityBadge, RecommendationBadge } from "../ui/StatusIndicator";
import { ScoreGauge } from "../ui/ScoreGauge";
import { ActiveTab } from "../layout/Sidebar";

interface DashboardViewProps {
  opportunities: TenderOpportunity[];
  tasks: ProcurementTask[];
  certificates: ComplianceCertificate[];
  bidPackages: BidPackage[];
  onSelectOpportunity: (opp: TenderOpportunity) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenImportModal: () => void;
  onToggleTask: (taskId: string) => void;
}

export function DashboardView({
  opportunities,
  tasks,
  certificates,
  bidPackages,
  onSelectOpportunity,
  setActiveTab,
  onOpenImportModal,
  onToggleTask,
}: DashboardViewProps) {
  // Aggregate statistics
  const totalPipelineValue = opportunities.reduce((acc, curr) => acc + curr.contractValue, 0);
  const recommendedBids = opportunities.filter((o) => o.decision === "RECOMMENDED BID" || o.recommendation === "BID");
  const conditionalBids = opportunities.filter((o) => o.decision === "CONDITIONAL BID" || o.recommendation === "REVIEW");
  const noBids = opportunities.filter((o) => o.decision === "NO-BID / HIGH RISK" || o.recommendation === "NO-BID");

  const recommendedValue = recommendedBids.reduce((acc, curr) => acc + curr.contractValue, 0);
  const assessedOpps = opportunities.filter((o) => typeof o.overallScore === "number");
  const averageScore = assessedOpps.length > 0
    ? Math.round(assessedOpps.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / assessedOpps.length)
    : 80;

  const pendingTasks = tasks.filter((t) => !t.completed);
  const criticalTasks = pendingTasks.filter((t) => t.priority === "critical");
  const expiringCerts = certificates.filter((c) => c.status === "expiring_soon");

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Workflow Status & Value Saved */}
      <div className="rounded-xl bg-gradient-to-r from-[#0F2747] via-[#16365F] to-[#0F2747] text-white p-5 sm:p-6 shadow-sm border border-[#1E4679]/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#2F80ED]/30 text-[#93c5fd] border border-[#2F80ED]/40 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-[#2F80ED]" />
                Healthcare SME Tender Decision Engine
              </span>
              <span className="text-xs text-slate-300">
                · Framework Active: NHS Supply Chain & TED EU
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Tender Opportunity Assessment & Bid/No-Bid Funnel
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Evaluating 6 active healthcare tenders totaling{" "}
              <strong className="text-white font-semibold">{formatCurrency(totalPipelineValue)}</strong>.
              AI capability alignment recommends proceeding with 3 high-probability bids (
              {formatCurrency(recommendedValue)}) while saving an estimated £28,000 in drafting
              overheads on non-compliant bids.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={onOpenImportModal}
              variant="primary"
              size="sm"
              className="bg-[#2F80ED] hover:bg-[#256ecc] text-white shadow-sm font-semibold"
            >
              Analyze New Tender
            </Button>
            <Button
              onClick={() => setActiveTab("opportunities")}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              View All Tenders
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline */}
        <Card className="hover:border-slate-300 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Tender Pipeline</span>
              <div className="w-8 h-8 rounded-md bg-blue-50 text-[#2F80ED] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F2747]">
                {formatCurrency(totalPipelineValue)}
              </span>
              <span className="text-xs text-slate-500 font-medium">6 Healthcare RFPs</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Avg Contract Length</span>
              <span className="font-semibold text-slate-700">46 Months</span>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Bid Value */}
        <Card className="hover:border-emerald-300 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Approved Bid Target</span>
              <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">
                {formatCurrency(recommendedValue)}
              </span>
              <span className="text-xs font-medium text-emerald-600">3 Tenders</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Win Probability Weighted</span>
              <span className="font-semibold text-emerald-700">
                {formatCurrency(recommendedValue * 0.88)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Average Match Score */}
        <Card className="hover:border-slate-300 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Average Fit Score</span>
              <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F2747]">{averageScore}%</span>
              <span className="text-xs text-slate-500 font-medium">Capability Match</span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Regulatory Verification</span>
              <span className="font-semibold text-emerald-700">100% ISO & MDR</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Plan Tasks */}
        <Card className="hover:border-amber-300 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Action Plan Items</span>
              <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F2747]">
                {pendingTasks.length} Pending
              </span>
              <span className="text-xs text-amber-600 font-medium font-semibold">
                {criticalTasks.length} Critical
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Next Deadline</span>
              <span className="font-semibold text-rose-600">Oct 08 (Surgical C-Arm)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decision Matrix & Breakdown Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Tenders & AI Bid Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0F2747] uppercase tracking-wide">
                Healthcare Tenders & Decision Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Automated comparison against ApexMed capabilities, ISO certificates & past contracts
              </p>
            </div>
            <Button
              onClick={() => setActiveTab("opportunities")}
              variant="ghost"
              size="sm"
              className="text-xs text-[#2F80ED] hover:text-[#256ecc]"
            >
              View Detailed Table <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                onClick={() => onSelectOpportunity(opp)}
                className="group p-4 bg-white rounded-lg border border-slate-200/90 hover:border-[#2F80ED] hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-[11px] text-slate-500 font-medium">
                        {opp.referenceCode}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600 font-medium">{opp.contractingAuthority}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 text-[11px]">{opp.sector}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-[#0F2747] group-hover:text-[#2F80ED] transition-colors line-clamp-1">
                      {opp.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {opp.decisionRationale}
                    </p>
                  </div>

                  {/* Decision & Score */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#0F2747]">
                          {formatFullCurrency(opp.contractValue, opp.currency)}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{opp.daysRemaining} days left</span>
                        </div>
                      </div>
                      <ScoreGauge score={opp.overallScore ?? 0} size="sm" showLabel={false} />
                    </div>

                    {opp.decision ? (
                      <BidDecisionBadge decision={opp.decision} />
                    ) : (
                      <RecommendationBadge recommendation={opp.recommendation} />
                    )}
                  </div>
                </div>

                {/* Sub-strip with risk tag & action status */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 font-medium">
                      Match: {opp.requirements.filter((r) => r.companyMatchStatus === "compliant").length}/{opp.requirements.length} specs
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      {opp.risks.length > 0 ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span>{opp.risks.length} Risk Flag{opp.risks.length > 1 ? "s" : ""}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Clean Compliance</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[#2F80ED] font-medium group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect Evaluation</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Decision Matrix Summary & Action Watchlist */}
        <div className="space-y-6">
          {/* Bid / No-Bid Funnel Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Decision Funnel Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Recommended */}
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>RECOMMENDED BID</span>
                    </div>
                    <span>{recommendedBids.length} Tenders</span>
                  </div>
                  <div className="mt-1 text-xs text-emerald-700 flex justify-between">
                    <span>High technical & regulatory alignment</span>
                    <span className="font-bold">{formatCurrency(recommendedValue)}</span>
                  </div>
                </div>

                {/* Conditional */}
                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>CONDITIONAL BID</span>
                    </div>
                    <span>{conditionalBids.length} Tenders</span>
                  </div>
                  <div className="mt-1 text-xs text-amber-700 flex justify-between">
                    <span>Requires logistics partner or RFI clarity</span>
                    <span className="font-bold">
                      {formatCurrency(
                        conditionalBids.reduce((a, c) => a + c.contractValue, 0)
                      )}
                    </span>
                  </div>
                </div>

                {/* No-Bid */}
                <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>NO-BID / HIGH RISK</span>
                    </div>
                    <span>{noBids.length} Tender</span>
                  </div>
                  <div className="mt-1 text-xs text-rose-700 flex justify-between">
                    <span>Missing critical microbiological assay</span>
                    <span className="font-bold">Saved ~£18k effort</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                AI decision framework evaluates 5 dimensions: Technical Specs, Regulatory & CE/MDR,
                Commercial Margin, Past Deliveries, and Engineering Service SLA.
              </div>
            </CardContent>
          </Card>

          {/* Action Plan Tasks Due Soon */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Action Items Due Soon
              </CardTitle>
              <Button
                onClick={() => setActiveTab("tasks")}
                variant="ghost"
                size="sm"
                className="text-[11px] text-[#2F80ED] h-6 px-1.5"
              >
                View all ({pendingTasks.length})
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-2.5 rounded border border-slate-100 hover:border-slate-200 bg-slate-50/60 flex items-start gap-2.5 text-xs transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                    className="mt-0.5 rounded border-slate-300 text-[#2F80ED] focus:ring-[#2F80ED] cursor-pointer"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p
                      className={`font-medium line-clamp-2 leading-snug ${
                        task.completed ? "line-through text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-mono text-slate-400">{task.opportunityRef}</span>
                      <span
                        className={
                          task.priority === "critical"
                            ? "text-rose-600 font-semibold"
                            : "text-slate-600"
                        }
                      >
                        Due: {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Compliance & Vault Status */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Regulatory Evidence Vault
              </CardTitle>
              <Button
                onClick={() => setActiveTab("compliance")}
                variant="ghost"
                size="sm"
                className="text-[11px] text-[#2F80ED] h-6 px-1.5"
              >
                Manage Vault
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  ISO 13485:2016 (BSI)
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Valid (Nov 2026)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  EU MDR Class IIb (TÜV SÜD)
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Valid (Sept 2027)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  NHS DSPT Toolkit 25/26
                </span>
                <span className="text-[11px] font-semibold text-amber-700">Renewal June 2026</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  MHRA GDP Wholesaler
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Active</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
