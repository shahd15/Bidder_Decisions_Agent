import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  SlidersHorizontal,
  ExternalLink,
  Plus,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Clock,
  DollarSign,
  Tag,
  Database,
} from "lucide-react";
import { TenderOpportunity, RecommendationType, TenderSector } from "../../types/procurement";
import { formatCurrency, formatFullCurrency } from "../../lib/utils";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { RecommendationBadge } from "../ui/StatusIndicator";
import { ScoreGauge } from "../ui/ScoreGauge";
import { fetchRealTenders, assessTenderInSupabase } from "../../lib/supabase/tender-service";
import { useAuth } from "../../lib/supabase/auth-context";

interface OpportunitiesViewProps {
  opportunities: TenderOpportunity[];
  onSelectOpportunity: (opp: TenderOpportunity) => void;
  onOpenImportModal: () => void;
  initialSectorFilter?: string;
  onRefreshOpportunities?: (updated: TenderOpportunity[]) => void;
}

export function OpportunitiesView({
  opportunities: initialOpportunities,
  onSelectOpportunity,
  onOpenImportModal,
  initialSectorFilter = "All",
  onRefreshOpportunities,
}: OpportunitiesViewProps) {
  const { profile, isLiveSupabaseConfigured } = useAuth();
  const companyId = profile?.companyId || "comp-apexmed-01";

  // Data State
  const [opportunities, setOpportunities] = useState<TenderOpportunity[]>(initialOpportunities);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(initialSectorFilter);
  const [recommendationFilter, setRecommendationFilter] = useState<string>("All");
  const [minValueFilter, setMinValueFilter] = useState<number>(0);

  // Sort State: 1. highest bid score (default) | 2. nearest deadline
  const [sortBy, setSortBy] = useState<"score" | "deadline">("score");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Load live Supabase data on mount
  const loadSupabaseData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRealTenders(companyId);
      setOpportunities(data);
      if (onRefreshOpportunities) {
        onRefreshOpportunities(data);
      }
    } catch (err) {
      console.warn("Failed to load real Supabase tenders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseData();
  }, [companyId]);

  // Sync with prop if updated from outside
  useEffect(() => {
    if (initialOpportunities && initialOpportunities.length > 0) {
      setOpportunities(initialOpportunities);
    }
  }, [initialOpportunities]);

  // Helper to get recommendation value
  const getRecommendation = (opp: TenderOpportunity): RecommendationType | null => {
    if (opp.recommendation) return opp.recommendation;
    if (opp.overallScore === null || opp.overallScore === undefined) return null;
    if (opp.overallScore >= 80) return "BID";
    if (opp.overallScore >= 65) return "REVIEW";
    return "NO-BID";
  };

  // Analyze Tender Action
  const handleAnalyzeTender = async (e: React.MouseEvent, oppId: string) => {
    e.stopPropagation();
    setAnalyzingId(oppId);
    try {
      const assessed = await assessTenderInSupabase(oppId, companyId);
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? assessed : o))
      );
      if (onRefreshOpportunities) {
        onRefreshOpportunities(
          opportunities.map((o) => (o.id === oppId ? assessed : o))
        );
      }
    } catch (err) {
      console.error("Assessment error:", err);
    } finally {
      setAnalyzingId(null);
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedOpportunities = useMemo(() => {
    return opportunities
      .filter((opp) => {
        // Search Filter
        const term = search.toLowerCase();
        const matchesSearch =
          !term ||
          opp.title.toLowerCase().includes(term) ||
          opp.contractingAuthority.toLowerCase().includes(term) ||
          opp.sector.toLowerCase().includes(term) ||
          opp.referenceCode.toLowerCase().includes(term);

        // Category Filter
        const matchesCategory =
          categoryFilter === "All" ||
          opp.sector.toLowerCase() === categoryFilter.toLowerCase();

        // Recommendation Filter (BID, REVIEW, NO-BID, unanalyzed)
        const rec = getRecommendation(opp);
        let matchesRecommendation = true;
        if (recommendationFilter === "BID") {
          matchesRecommendation = rec === "BID";
        } else if (recommendationFilter === "REVIEW") {
          matchesRecommendation = rec === "REVIEW";
        } else if (recommendationFilter === "NO-BID") {
          matchesRecommendation = rec === "NO-BID";
        } else if (recommendationFilter === "unanalyzed") {
          matchesRecommendation = rec === null;
        }

        // Minimum Contract Value Filter
        const matchesMinValue = opp.contractValue >= minValueFilter;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesRecommendation &&
          matchesMinValue
        );
      })
      .sort((a, b) => {
        if (sortBy === "score") {
          // Sort 1: highest bid score (unassessed at the bottom)
          const scoreA = a.overallScore ?? -1;
          const scoreB = b.overallScore ?? -1;
          return sortOrder === "desc" ? scoreB - scoreA : scoreA - scoreB;
        } else {
          // Sort 2: nearest deadline (lowest daysRemaining first)
          const daysA = a.daysRemaining ?? 9999;
          const daysB = b.daysRemaining ?? 9999;
          return sortOrder === "asc" ? daysA - daysB : daysB - daysA;
        }
      });
  }, [
    opportunities,
    search,
    categoryFilter,
    recommendationFilter,
    minValueFilter,
    sortBy,
    sortOrder,
  ]);

  // Categories list derived from opportunities + core sectors
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.sector) set.add(o.sector);
    });
    set.add("Critical Care / ICU Equipment");
    set.add("Medical Equipment");
    set.add("Diagnostic Imaging");
    set.add("Laboratory & Reagents");
    set.add("Medical Devices");
    set.add("Healthcare IT");
    set.add("Hospital Facilities");
    return Array.from(set);
  }, [opportunities]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#0F2747]">
              Healthcare Opportunities Pipeline
            </h1>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Real Supabase Data</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active NHS and European hospital tenders synchronized from Supabase with AI bid scores and recommendations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadSupabaseData}
            variant="outline"
            size="sm"
            disabled={isLoading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            className="text-xs text-slate-700"
          >
            {isLoading ? "Syncing..." : "Sync Supabase"}
          </Button>

          <Button
            onClick={onOpenImportModal}
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            Import Tender
          </Button>
        </div>
      </div>

      {/* Control Panel: Filters & Sorting */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5">
        {/* Row 1: Search & Recommendation Segmented Filters */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tender title, authority, reference code..."
              className="w-full h-8 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2F80ED] focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Recommendation Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Recommendation:
            </span>
            <button
              onClick={() => setRecommendationFilter("All")}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                recommendationFilter === "All"
                  ? "bg-[#0F2747] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({opportunities.length})
            </button>

            <button
              onClick={() => setRecommendationFilter("BID")}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                recommendationFilter === "BID"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/70"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              BID
            </button>

            <button
              onClick={() => setRecommendationFilter("REVIEW")}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                recommendationFilter === "REVIEW"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/70"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              REVIEW
            </button>

            <button
              onClick={() => setRecommendationFilter("NO-BID")}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                recommendationFilter === "NO-BID"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100/70"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              NO-BID
            </button>

            <button
              onClick={() => setRecommendationFilter("unanalyzed")}
              className={`px-2 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                recommendationFilter === "unanalyzed"
                  ? "bg-slate-700 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              Unanalyzed
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter, Min Value Filter, & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px]">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-7 text-xs bg-slate-50 border border-slate-200 rounded px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
              >
                <option value="All">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Contract Value Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px]">Min Value:</span>
              <select
                value={minValueFilter}
                onChange={(e) => setMinValueFilter(Number(e.target.value))}
                className="h-7 text-xs bg-slate-50 border border-slate-200 rounded px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
              >
                <option value={0}>Any Contract Value</option>
                <option value={500000}>£500,000+</option>
                <option value={1000000}>£1,000,000+</option>
                <option value={2000000}>£2,000,000+</option>
                <option value={5000000}>£5,000,000+</option>
              </select>
            </div>
          </div>

          {/* Sort Controls: 1. highest bid score | 2. nearest deadline */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold text-[11px] mr-1">Sort:</span>

            {/* 1. Highest Bid Score */}
            <button
              onClick={() => {
                if (sortBy === "score") {
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                } else {
                  setSortBy("score");
                  setSortOrder("desc");
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                sortBy === "score"
                  ? "bg-blue-50 text-[#2F80ED] border border-blue-200 font-bold shadow-2xs"
                  : "text-slate-600 bg-slate-50 hover:bg-slate-100"
              }`}
              title="Sort by highest AI bid score"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Highest Bid Score</span>
              {sortBy === "score" && <span>{sortOrder === "desc" ? "↓" : "↑"}</span>}
            </button>

            {/* 2. Nearest Deadline */}
            <button
              onClick={() => {
                if (sortBy === "deadline") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("deadline");
                  setSortOrder("asc");
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                sortBy === "deadline"
                  ? "bg-blue-50 text-[#2F80ED] border border-blue-200 font-bold shadow-2xs"
                  : "text-slate-600 bg-slate-50 hover:bg-slate-100"
              }`}
              title="Sort by nearest submission deadline"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Nearest Deadline</span>
              {sortBy === "deadline" && <span>{sortOrder === "asc" ? "↑" : "↓"}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Opportunities List Cards */}
      <div className="space-y-3.5">
        {filteredAndSortedOpportunities.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No opportunities match the selected criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your category, recommendation, or minimum value filters.
            </p>
            <Button
              onClick={() => {
                setSearch("");
                setCategoryFilter("All");
                setRecommendationFilter("All");
                setMinValueFilter(0);
              }}
              variant="outline"
              size="sm"
              className="mt-3.5 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredAndSortedOpportunities.map((opp) => {
            const recommendation = getRecommendation(opp);
            const isAssessed =
              opp.overallScore !== null &&
              opp.overallScore !== undefined &&
              opp.overallScore > 0;

            return (
              <div
                key={opp.id}
                onClick={() => onSelectOpportunity(opp)}
                className="group p-5 bg-white rounded-xl border border-slate-200/90 hover:border-[#2F80ED] hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left Column: Title, Category, Organization, Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Category & Reference Header Line */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Healthcare Category Badge */}
                      <span className="font-semibold text-blue-700 bg-blue-50/80 border border-blue-200/80 px-2 py-0.5 rounded text-[11px]">
                        {opp.sector}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500 text-[11px] font-semibold">
                        {opp.referenceCode}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 text-[11px]">{opp.country}</span>
                    </div>

                    {/* Tender Title */}
                    <h2 className="text-base font-bold text-[#0F2747] group-hover:text-[#2F80ED] transition-colors leading-snug">
                      {opp.title}
                    </h2>

                    {/* Contracting Organization */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{opp.contractingAuthority}</span>
                      {opp.authorityType && (
                        <span className="text-slate-400 text-[11px]">
                          ({opp.authorityType})
                        </span>
                      )}
                    </div>

                    {/* AI Assessment / Unassessed Callout */}
                    {isAssessed ? (
                      <p className="text-xs text-slate-600 leading-relaxed max-w-4xl pt-0.5 line-clamp-2">
                        <span className="font-semibold text-slate-800">AI Evaluation: </span>
                        {opp.decisionRationale ||
                          `Assessed fit for ${opp.sector}: regulatory and clinical capability alignment verified.`}
                      </p>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2 max-w-3xl">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-medium">
                            Analyze this tender to generate a BidderDecisions score.
                          </span>
                        </div>
                        <Button
                          onClick={(e) => handleAnalyzeTender(e, opp.id)}
                          variant="primary"
                          size="sm"
                          disabled={analyzingId === opp.id}
                          className="h-6 text-[11px] px-2.5 py-0 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                        >
                          {analyzingId === opp.id ? "Analyzing..." : "Analyze Tender"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Contract Value, Deadline, Bid Score, Recommendation */}
                  <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Contract Value & Deadline */}
                    <div className="text-left sm:text-right space-y-0.5">
                      <div className="text-base font-extrabold text-[#0F2747]">
                        {formatFullCurrency(opp.contractValue, opp.currency)}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center sm:justify-end gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span
                          className={
                            opp.daysRemaining <= 14
                              ? "text-rose-600 font-bold"
                              : "text-slate-600"
                          }
                        >
                          Deadline: {opp.submissionDeadline}{" "}
                          {opp.daysRemaining !== undefined && (
                            <span className="text-slate-400">({opp.daysRemaining}d)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Score & Recommendation Row */}
                    <div className="flex items-center gap-3">
                      {isAssessed ? (
                        <>
                          <div className="flex items-center gap-2">
                            <ScoreGauge
                              score={opp.overallScore!}
                              size="sm"
                              showLabel={false}
                            />
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
                                Bid Score
                              </span>
                              <span className="text-sm font-bold text-[#0F2747]">
                                {opp.overallScore}
                                <span className="text-[11px] text-slate-400">/100</span>
                              </span>
                            </div>
                          </div>
                          <RecommendationBadge recommendation={recommendation} />
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded italic">
                            Unscored
                          </span>
                          <RecommendationBadge recommendation={null} />
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs group-hover:border-[#2F80ED] group-hover:text-[#2F80ED]"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
