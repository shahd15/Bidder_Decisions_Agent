export type BidDecision = "RECOMMENDED BID" | "CONDITIONAL BID" | "NO-BID / HIGH RISK";
export type RecommendationType = "BID" | "REVIEW" | "NO-BID";

export type TenderSector =
  | "Medical Equipment"
  | "Medical Devices"
  | "Laboratory & Reagents"
  | "Pharmaceuticals"
  | "Healthcare IT"
  | "Hospital Facilities";

export type RequirementStatus = "compliant" | "conditional" | "missing" | "pending_review";

export type RiskSeverity = "critical" | "warning" | "low";

export interface RequirementItem {
  id: string;
  category: "Technical Specification" | "Regulatory & Compliance" | "Commercial & Financial" | "Delivery & Service SLA" | "Social Value / Carbon Net Zero";
  text: string;
  mandatory: boolean;
  companyMatchStatus: RequirementStatus;
  matchingEvidence?: string;
  notes?: string;
}

export interface RiskItem {
  id: string;
  severity: RiskSeverity;
  title: string;
  description: string;
  impactScore: number; // e.g. -15 on score
  mitigationStrategy: string;
  owner?: string;
}

export interface ScoresBreakdown {
  technicalCapability: number; // 0 - 100
  regulatoryCompliance: number; // 0 - 100
  commercialViability: number; // 0 - 100
  pastPerformance: number; // 0 - 100
  deliveryCapacity: number; // 0 - 100
}

export interface TenderOpportunity {
  id: string;
  referenceCode: string;
  title: string;
  contractingAuthority: string;
  authorityType: "NHS Foundation Trust" | "Regional Health Board" | "University Hospital" | "Private Hospital Group" | "National Health Service";
  country: "UK" | "Germany" | "France" | "Nordics" | "USA";
  sector: TenderSector;
  cpvCode: string;
  publicationDate: string;
  submissionDeadline: string;
  daysRemaining: number;
  contractValue: number;
  currency: "GBP" | "EUR" | "USD";
  contractDurationMonths: number;
  
  // Bid Decision & Recommendation
  overallScore?: number | null; // 0 - 100, or null if unanalyzed
  decision?: BidDecision | null;
  recommendation?: RecommendationType | null;
  isAssessed?: boolean;
  decisionRationale?: string;
  scoresBreakdown?: ScoresBreakdown;
  
  // Pipeline status
  status: "new_tender" | "under_review" | "bid_approved" | "bid_declined" | "drafting_submission" | "submitted";
  
  // Extracted elements
  requirements: RequirementItem[];
  risks: RiskItem[];
  
  // Action Plan count
  actionPlanCount: {
    total: number;
    completed: number;
    criticalPending: number;
  };

  clarificationDeadline?: string;
  frameworkName?: string;
}

export interface ComplianceCertificate {
  id: string;
  name: string;
  standard: string;
  issuer: string;
  certificateNumber: string;
  validFrom: string;
  expiryDate: string;
  status: "active" | "expiring_soon" | "expired";
  applicableSectors: TenderSector[];
  documentUrl?: string;
  fileSize?: string;
  verifiedByAudit: boolean;
}

export interface ProcurementTask {
  id: string;
  opportunityId: string;
  opportunityRef: string;
  opportunityTitle: string;
  title: string;
  category: "Clarification RFI" | "Technical Gap" | "Regulatory Evidence" | "Pricing Model" | "Executive Sign-Off";
  priority: "critical" | "high" | "medium";
  dueDate: string;
  assignee: {
    name: string;
    role: string;
    avatarInitials: string;
  };
  completed: boolean;
  notes?: string;
}

export interface BidPackageSection {
  id: string;
  title: string;
  description: string;
  wordCountTarget: number;
  wordCountCurrent: number;
  status: "complete" | "draft" | "not_started";
  lastEditedBy: string;
  lastEditedDate: string;
  previewSnippet: string;
}

export interface BidPackage {
  id: string;
  opportunityId: string;
  opportunityRef: string;
  opportunityTitle: string;
  contractingAuthority: string;
  contractValue: number;
  currency: "GBP" | "EUR" | "USD";
  submissionDeadline: string;
  version: string;
  status: "drafting" | "internal_review" | "ready_for_export";
  completionPercentage: number;
  sections: BidPackageSection[];
  complianceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProduct {
  id?: string;
  name: string;
  category: string;
  description: string;
  certifications: string;
  ceMarkMdrStatus?: string;
  gdpCertified?: boolean;
  leadTimeWeeks?: number;
}

export interface CompanyCertification {
  id?: string;
  name: string;
  certificateNumber: string;
  issuingBody: string;
  issueDate: string;
  expiryDate: string;
  standard?: string;
  issuer?: string;
  status?: "active" | "expiring_soon" | "expired";
}

export interface PreviousProject {
  id?: string;
  projectName: string;
  healthcareOrganization: string;
  category: string;
  approximateValue: number;
  year: number;
  client?: string;
  title?: string;
  value?: number;
  yearCompleted?: number;
  rating?: number;
}

export interface CompanyProfile {
  id: string;
  name: string;
  businessType: string;
  description: string;
  location: string;
  preferredRegions: string[];
  minContractValue: number;
  maxContractValue: number;
  annualContractCapacity: number;
  products: CompanyProduct[];
  certifications: CompanyCertification[];
  previousProjects: PreviousProject[];

  // Legacy/Compatibility fields
  legalEntity?: string;
  registrationNumber?: string;
  smeClassification?: "Small" | "Medium" | "Micro-enterprise";
  foundedYear?: number;
  headquarters?: string;
  sectors?: TenderSector[];
  annualTurnover?: number;
  bondingCapacity?: number;
  qualityManager?: string;
  bidDirector?: string;
  capabilitiesSummary?: string;
  facilities?: string[];
  keyProducts?: Array<{
    name: string;
    category: string;
    ceMarkMdrStatus: string;
    gdpCertified: boolean;
    leadTimeWeeks: number;
  }>;
  pastContracts?: Array<{
    client: string;
    title: string;
    value: number;
    yearCompleted: number;
    rating: number; // 1-5
  }>;
}

export type DocumentType =
  | "ISO certificates"
  | "CE certificates"
  | "commercial registration"
  | "tax documents"
  | "financial statements"
  | "manufacturer authorizations"
  | "previous contracts"
  | "product catalogs"
  | "other procurement documents";

export type VerificationStatus = "FOUND" | "PENDING" | "EXPIRED" | "NEEDS_REVIEW";

export interface CompanyDocument {
  id: string;
  companyId: string;
  filename: string;
  documentType: DocumentType;
  uploadDate: string;
  fileSize: string;
  verificationStatus: VerificationStatus;
  storagePath?: string;
  fileUrl?: string;
  uploadedBy?: string;
  notes?: string;
}
