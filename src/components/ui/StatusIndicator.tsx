import React from "react";
import { cn } from "../../lib/utils";
import { BidDecision, RecommendationType, RequirementStatus, RiskSeverity, VerificationStatus } from "../../types/procurement";

export function RecommendationBadge({
  recommendation,
  className,
}: {
  recommendation?: RecommendationType | null;
  className?: string;
}) {
  if (recommendation === "BID") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded shadow-2xs tracking-wide",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        BID
      </span>
    );
  }
  if (recommendation === "REVIEW") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded shadow-2xs tracking-wide",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        REVIEW
      </span>
    );
  }
  if (recommendation === "NO-BID") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2.5 py-0.5 rounded shadow-2xs tracking-wide",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        NO-BID
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded italic",
        className
      )}
    >
      Pending Assessment
    </span>
  );
}

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case "FOUND":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          FOUND
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F80ED] animate-pulse" />
          PENDING
        </span>
      );
    case "NEEDS_REVIEW":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          NEEDS_REVIEW
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          EXPIRED
        </span>
      );
  }
}

export function BidDecisionBadge({ decision }: { decision: BidDecision }) {
  if (decision === "RECOMMENDED BID") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200/80 px-2 py-0.5 rounded">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        RECOMMENDED BID
      </span>
    );
  }
  if (decision === "CONDITIONAL BID") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50/80 border border-amber-200/80 px-2 py-0.5 rounded">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        CONDITIONAL BID
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50/80 border border-rose-200/80 px-2 py-0.5 rounded">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      NO-BID / HIGH RISK
    </span>
  );
}

export function RequirementStatusTag({ status }: { status: RequirementStatus }) {
  switch (status) {
    case "compliant":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Compliant
        </span>
      );
    case "conditional":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Conditional / Gap
        </span>
      );
    case "missing":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Missing / Disqualifier
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Pending Review
        </span>
      );
  }
}

export function RiskSeverityBadge({ severity }: { severity: RiskSeverity }) {
  switch (severity) {
    case "critical":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded">
          Critical Risk
        </span>
      );
    case "warning":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
          Warning
        </span>
      );
    case "low":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
          Low Impact
        </span>
      );
  }
}

export function PipelineStatusTag({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    new_tender: { label: "New Tender", color: "text-blue-700 bg-blue-50 border-blue-200" },
    under_review: { label: "Under AI Review", color: "text-amber-700 bg-amber-50 border-amber-200" },
    bid_approved: { label: "Bid Approved", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    bid_declined: { label: "Bid Declined", color: "text-slate-600 bg-slate-100 border-slate-200" },
    drafting_submission: { label: "Drafting Submission", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    submitted: { label: "Submitted to Buyer", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  };

  const item = map[status] || { label: status, color: "text-slate-600 bg-slate-100 border-slate-200" };
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded border inline-block", item.color)}>
      {item.label}
    </span>
  );
}
