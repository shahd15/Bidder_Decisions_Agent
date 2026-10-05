import React from "react";
import { cn } from "../../lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreGauge({ score, size = "md", showLabel = true }: ScoreGaugeProps) {
  // Color determination based on prompt requirements:
  // green for positive states, amber for warnings, red for critical states
  let color = "#10B981"; // green
  let textColor = "text-emerald-700";
  let bgFill = "stroke-emerald-500";
  let labelText = "High Win Probability";

  if (score < 60) {
    color = "#EF4444"; // red
    textColor = "text-rose-700";
    bgFill = "stroke-rose-500";
    labelText = "Critical Risk / No-Bid";
  } else if (score < 80) {
    color = "#F59E0B"; // amber
    textColor = "text-amber-700";
    bgFill = "stroke-amber-500";
    labelText = "Conditional Feasibility";
  }

  const dimensions = {
    sm: { width: 44, strokeWidth: 4, radius: 18, textSize: "text-xs font-bold" },
    md: { width: 72, strokeWidth: 6, radius: 30, textSize: "text-lg font-bold" },
    lg: { width: 110, strokeWidth: 8, radius: 46, textSize: "text-2xl font-bold" },
  };

  const dim = dimensions[size];
  const circumference = 2 * Math.PI * dim.radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative inline-flex items-center justify-center shrink-0">
        <svg
          width={dim.width}
          height={dim.width}
          viewBox={`0 0 ${dim.width} ${dim.width}`}
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <circle
            cx={dim.width / 2}
            cy={dim.width / 2}
            r={dim.radius}
            stroke="#E2E8F0"
            strokeWidth={dim.strokeWidth}
            fill="none"
          />
          {/* Animated Value Arc */}
          <circle
            cx={dim.width / 2}
            cy={dim.width / 2}
            r={dim.radius}
            stroke={color}
            strokeWidth={dim.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(dim.textSize, "text-[#0F2747] font-semibold tracking-tight")}>
            {score}
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span className={cn("text-xs font-semibold", textColor)}>{labelText}</span>
          <span className="text-[11px] text-slate-500">Fit & Win Score</span>
        </div>
      )}
    </div>
  );
}

export function ScoreProgressBar({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight?: string;
}) {
  let barColor = "bg-emerald-500";
  if (score < 60) barColor = "bg-rose-500";
  else if (score < 80) barColor = "bg-amber-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {weight && <span className="text-[10px] text-slate-400">Weight: {weight}</span>}
          <span className="font-semibold text-slate-900">{score}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
