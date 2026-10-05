import React, { useState, useEffect } from "react";
import {
  Building2,
  Package,
  Award,
  Clock,
  MapPin,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Save,
  Globe,
  Briefcase,
  TrendingUp,
  FileCheck2,
  Info,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  CompanyProfile,
  CompanyProduct,
  CompanyCertification,
  PreviousProject,
  TenderSector,
} from "../../types/procurement";
import { formatCurrency, formatFullCurrency } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import {
  saveCompanyProfile,
  hasUserSavedCustomProfile,
} from "../../lib/supabase/company-service";

interface CompanyViewProps {
  profile: CompanyProfile;
  onUpdateProfile: (profile: CompanyProfile) => void;
}

const HEALTHCARE_BUSINESS_TYPES = [
  "Medical Equipment Supplier",
  "Medical Device Distributor",
  "Laboratory Supplier",
  "Pharmaceutical Distributor",
  "Healthcare Technology Company",
  "Hospital Equipment Supplier",
];

const UK_HEALTHCARE_REGIONS = [
  "London & South East",
  "East of England",
  "Midlands (West & East)",
  "North West & Mersey",
  "North East & Yorkshire",
  "South West",
  "Scotland (NHS National Services)",
  "Wales (NHS Shared Services)",
  "Northern Ireland (HSC)",
  "European Union / Cross-Border",
];

const PRODUCT_CATEGORIES = [
  "Critical Care / ICU Equipment",
  "Diagnostic Imaging & Radiology",
  "Surgical Instruments & Theaters",
  "Orthopedic & Implantable Devices",
  "Laboratory & In-Vitro Diagnostics (IVD)",
  "Pharmaceutical & Biologics Cold Chain",
  "Healthcare IT, Telemetry & Virtual Ward",
  "Hospital Facilities & Infection Control",
  "Patient Care & Hospital Ward Furniture",
];

export function CompanyView({ profile, onUpdateProfile }: CompanyViewProps) {
  // Main form state
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [activeTab, setActiveTab] = useState<
    "general" | "products" | "certifications" | "projects"
  >("general");

  // Save states & feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCustomSaved, setIsCustomSaved] = useState(hasUserSavedCustomProfile());

  // Modal states for adding/editing items
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<CompanyProduct>({
    name: "",
    category: "Critical Care / ICU Equipment",
    description: "",
    certifications: "",
  });

  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [certForm, setCertForm] = useState<CompanyCertification>({
    name: "",
    certificateNumber: "",
    issuingBody: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
  });

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState<PreviousProject>({
    projectName: "",
    healthcareOrganization: "",
    category: "Critical Care / ICU Equipment",
    approximateValue: 500000,
    year: new Date().getFullYear() - 1,
  });

  // Keep state in sync if parent changes
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Form validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Company name is required.";
    }
    if (!formData.businessType) {
      errors.businessType = "Please select your primary business type.";
    }
    if (!formData.description.trim() || formData.description.trim().length < 15) {
      errors.description = "Please provide a detailed description (at least 15 characters).";
    }
    if (!formData.location.trim()) {
      errors.location = "Company location/headquarters is required.";
    }
    if (!formData.preferredRegions || formData.preferredRegions.length === 0) {
      errors.preferredRegions = "Select at least one preferred procurement region.";
    }
    if (formData.minContractValue < 0) {
      errors.minContractValue = "Minimum contract value cannot be negative.";
    }
    if (formData.maxContractValue < formData.minContractValue) {
      errors.maxContractValue = "Maximum contract value must be greater than or equal to minimum value.";
    }
    if (formData.annualContractCapacity <= 0) {
      errors.annualContractCapacity = "Annual contract capacity must be greater than zero.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Main Save Handler
  const handleSaveToSupabase = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    if (!validateForm()) {
      setActiveTab("general");
      setSaveError("Please resolve the highlighted validation errors before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveCompanyProfile(formData);
      if (result.success) {
        setIsCustomSaved(true);
        onUpdateProfile(formData);
        setSaveSuccess(
          result.savedToRemoteSupabase
            ? "Company profile and evidence vault successfully synchronized to live Supabase database!"
            : "Company profile saved and verified. Your custom supplier profile is now active across BidderDecisions."
        );
        setTimeout(() => setSaveSuccess(null), 5000);
      } else {
        setSaveError(result.error || "Failed to save profile to Supabase.");
      }
    } catch (err: any) {
      setSaveError(err?.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Region Toggle
  const toggleRegion = (region: string) => {
    const current = formData.preferredRegions || [];
    const updated = current.includes(region)
      ? current.filter((r) => r !== region)
      : [...current, region];
    setFormData({ ...formData, preferredRegions: updated });
    if (formErrors.preferredRegions) {
      setFormErrors({ ...formErrors, preferredRegions: "" });
    }
  };

  // Product Handlers
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.description.trim()) return;

    let updatedProducts = [...(formData.products || [])];
    if (editingProductIndex !== null) {
      updatedProducts[editingProductIndex] = productForm;
    } else {
      updatedProducts.push({
        ...productForm,
        id: `prod-${Date.now()}`,
      });
    }

    setFormData({ ...formData, products: updatedProducts });
    setShowProductModal(false);
    setEditingProductIndex(null);
    setProductForm({
      name: "",
      category: "Critical Care / ICU Equipment",
      description: "",
      certifications: "",
    });
  };

  const handleDeleteProduct = (index: number) => {
    const updated = formData.products.filter((_, i) => i !== index);
    setFormData({ ...formData, products: updated });
  };

  // Certification Handlers
  const handleSaveCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.name.trim() || !certForm.certificateNumber.trim()) return;

    let updatedCerts = [...(formData.certifications || [])];
    if (editingCertIndex !== null) {
      updatedCerts[editingCertIndex] = certForm;
    } else {
      updatedCerts.push({
        ...certForm,
        id: `cert-${Date.now()}`,
      });
    }

    setFormData({ ...formData, certifications: updatedCerts });
    setShowCertModal(false);
    setEditingCertIndex(null);
    setCertForm({
      name: "",
      certificateNumber: "",
      issuingBody: "",
      issueDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
    });
  };

  const handleDeleteCert = (index: number) => {
    const updated = formData.certifications.filter((_, i) => i !== index);
    setFormData({ ...formData, certifications: updated });
  };

  // Previous Project Handlers
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.projectName.trim() || !projectForm.healthcareOrganization.trim()) return;

    let updatedProjects = [...(formData.previousProjects || [])];
    if (editingProjectIndex !== null) {
      updatedProjects[editingProjectIndex] = projectForm;
    } else {
      updatedProjects.push({
        ...projectForm,
        id: `proj-${Date.now()}`,
      });
    }

    setFormData({ ...formData, previousProjects: updatedProjects });
    setShowProjectModal(false);
    setEditingProjectIndex(null);
    setProjectForm({
      projectName: "",
      healthcareOrganization: "",
      category: "Critical Care / ICU Equipment",
      approximateValue: 500000,
      year: new Date().getFullYear() - 1,
    });
  };

  const handleDeleteProject = (index: number) => {
    const updated = formData.previousProjects.filter((_, i) => i !== index);
    setFormData({ ...formData, previousProjects: updated });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Save Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0F2747] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
              <Building2 className="w-6 h-6 text-[#2F80ED]" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F2747] tracking-tight">
                  {formData.name || "Healthcare SME Profile"}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#2F80ED] border border-blue-200">
                  {formData.businessType}
                </span>
                {isCustomSaved ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Custom Profile Saved & Active
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Baseline Template Loaded
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{formData.location || "Location not specified"}</span>
                <span>·</span>
                <span>Annual Capacity: {formatCurrency(formData.annualContractCapacity)}</span>
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleSaveToSupabase}
              variant="primary"
              size="md"
              disabled={isSaving}
              icon={
                isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )
              }
              className="shadow-xs font-semibold"
            >
              {isSaving ? "Saving to Supabase..." : "Save Company Profile"}
            </Button>
          </div>
        </div>

        {/* Success State Alert */}
        {saveSuccess && (
          <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Profile Successfully Saved</span>
              <p>{saveSuccess}</p>
            </div>
          </div>
        )}

        {/* Error State Alert */}
        {saveError && (
          <div className="mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Validation or Save Notice</span>
              <p>{saveError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs gap-1">
        {[
          { id: "general", label: "General & Procurement Parameters", icon: Building2 },
          {
            id: "products",
            label: `Products & Devices (${formData.products?.length || 0})`,
            icon: Package,
          },
          {
            id: "certifications",
            label: `Regulatory Certifications (${formData.certifications?.length || 0})`,
            icon: Award,
          },
          {
            id: "projects",
            label: `Previous Hospital Projects (${formData.previousProjects?.length || 0})`,
            icon: Briefcase,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 font-semibold text-xs border-b-2 -mb-px transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#2F80ED] text-[#2F80ED]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL COMPANY PROFILE & PROCUREMENT BOUNDS */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[#0F2747]">
                  Company Identification & Business Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Company Registered Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                    }}
                    placeholder="e.g. ApexMed Healthcare Solutions Ltd"
                    className={`w-full h-9 px-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED] bg-white text-slate-900 ${
                      formErrors.name ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-300"
                    }`}
                  />
                  {formErrors.name && (
                    <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                      {formErrors.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Business Type / Supplier Classification <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => {
                        setFormData({ ...formData, businessType: e.target.value });
                        if (formErrors.businessType)
                          setFormErrors({ ...formErrors, businessType: "" });
                      }}
                      className="w-full h-9 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED] bg-white text-slate-900"
                    >
                      {HEALTHCARE_BUSINESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Headquarters Location <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => {
                        setFormData({ ...formData, location: e.target.value });
                        if (formErrors.location) setFormErrors({ ...formErrors, location: "" });
                      }}
                      placeholder="e.g. Cambridge Biomedical Campus, CB2 0AH, UK"
                      className={`w-full h-9 px-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED] bg-white text-slate-900 ${
                        formErrors.location
                          ? "border-rose-300 ring-1 ring-rose-200"
                          : "border-slate-300"
                      }`}
                    />
                    {formErrors.location && (
                      <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                        {formErrors.location}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Company Description & Capability Statement <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (formErrors.description)
                        setFormErrors({ ...formErrors, description: "" });
                    }}
                    placeholder="Describe your manufacturing, clinical distribution, service SLA capabilities, and track record..."
                    className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED] bg-white text-slate-900 text-xs leading-relaxed ${
                      formErrors.description
                        ? "border-rose-300 ring-1 ring-rose-200"
                        : "border-slate-300"
                    }`}
                  />
                  {formErrors.description && (
                    <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                      {formErrors.description}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preferred Procurement Regions */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-[#0F2747]">
                    Target Procurement Regions & Coverage
                  </CardTitle>
                  <span className="text-[11px] text-slate-500">
                    {formData.preferredRegions?.length || 0} Regions Selected
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                <p className="text-slate-500 text-[11px]">
                  Select the NHS health boards, trusts, or regional procurement hubs your team can
                  service within required logistics response times:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {UK_HEALTHCARE_REGIONS.map((region) => {
                    const isSelected = formData.preferredRegions?.includes(region);
                    return (
                      <button
                        type="button"
                        key={region}
                        onClick={() => toggleRegion(region)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                          isSelected
                            ? "border-[#2F80ED] bg-blue-50/60 text-[#0F2747] font-semibold"
                            : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{region}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#2F80ED]" />}
                      </button>
                    );
                  })}
                </div>
                {formErrors.preferredRegions && (
                  <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                    {formErrors.preferredRegions}
                  </span>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Contract Value Parameters */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[#0F2747]">
                  Tender Capacity & Value Bounds
                </CardTitle>
                <p className="text-[11px] text-slate-500">
                  Used by the AI Bid/No-Bid score to filter out tenders outside commercial capability
                </p>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Minimum Contract Value (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      £
                    </span>
                    <input
                      type="number"
                      value={formData.minContractValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minContractValue: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full h-9 pl-7 pr-3 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
                    />
                  </div>
                  {formErrors.minContractValue && (
                    <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                      {formErrors.minContractValue}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Maximum Contract Value (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      £
                    </span>
                    <input
                      type="number"
                      value={formData.maxContractValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxContractValue: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full h-9 pl-7 pr-3 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
                    />
                  </div>
                  {formErrors.maxContractValue && (
                    <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                      {formErrors.maxContractValue}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Annual Contract Capacity / Bonding (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      £
                    </span>
                    <input
                      type="number"
                      value={formData.annualContractCapacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          annualContractCapacity: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full h-9 pl-7 pr-3 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2F80ED]"
                    />
                  </div>
                  {formErrors.annualContractCapacity && (
                    <span className="text-[11px] text-rose-600 mt-1 block font-medium">
                      {formErrors.annualContractCapacity}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1 text-[11px]">
                  <span className="font-semibold text-slate-700">Financial Ratio Preview:</span>
                  <div className="flex justify-between text-slate-500 pt-1">
                    <span>Sweet-Spot RFP Size:</span>
                    <strong className="text-slate-800">
                      {formatCurrency(formData.minContractValue)} -{" "}
                      {formatCurrency(formData.maxContractValue)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Turnover Coverage:</span>
                    <strong className="text-slate-800">
                      {((formData.maxContractValue / (formData.annualContractCapacity || 1)) * 100).toFixed(0)}% max exposure
                    </strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & DEVICES */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#0F2747] uppercase tracking-wide">
                Medical Device & Equipment Catalog
              </h2>
              <p className="text-xs text-slate-500">
                Products referenced by the AI engine when matching tender technical schedules
              </p>
            </div>

            <Button
              onClick={() => {
                setEditingProductIndex(null);
                setProductForm({
                  name: "",
                  category: "Critical Care / ICU Equipment",
                  description: "",
                  certifications: "",
                });
                setShowProductModal(true);
              }}
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Product
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.products?.map((prod, idx) => (
              <Card key={prod.id || idx} className="hover:border-slate-300 transition-all flex flex-col justify-between">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {prod.category}
                      </span>
                      <h3 className="text-sm font-bold text-[#0F2747] leading-snug">{prod.name}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingProductIndex(idx);
                          setProductForm(prod);
                          setShowProductModal(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{prod.description}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Compliance & Regulatory:</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {prod.certifications || "Standard CE Conforming"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REGULATORY CERTIFICATIONS */}
      {activeTab === "certifications" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#0F2747] uppercase tracking-wide">
                Regulatory Standards & Audit Certifications
              </h2>
              <p className="text-xs text-slate-500">
                Quality accreditations (ISO 13485, CE MDR, DSPT) validated during tender exclusion checks
              </p>
            </div>

            <Button
              onClick={() => {
                setEditingCertIndex(null);
                setCertForm({
                  name: "",
                  certificateNumber: "",
                  issuingBody: "",
                  issueDate: new Date().toISOString().split("T")[0],
                  expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000)
                    .toISOString()
                    .split("T")[0],
                });
                setShowCertModal(true);
              }}
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Certification
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.certifications?.map((cert, idx) => (
              <Card key={cert.id || idx} className="hover:border-slate-300 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#2F80ED]" />
                        <h3 className="text-xs font-bold text-[#0F2747]">{cert.name}</h3>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        Cert #: {cert.certificateNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCertIndex(idx);
                          setCertForm(cert);
                          setShowCertModal(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCert(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Issuing Body / Notified Body:</span>
                      <strong className="text-slate-800">{cert.issuingBody}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Issue Date:</span>
                      <span className="text-slate-700">{cert.issueDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expiry Date:</span>
                      <strong className="text-emerald-700">{cert.expiryDate}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PREVIOUS PROJECTS & REFERENCES */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#0F2747] uppercase tracking-wide">
                Healthcare Contract Track Record & Case References
              </h2>
              <p className="text-xs text-slate-500">
                Verified deliveries used by AI to maximize scoring in past-performance evaluations
              </p>
            </div>

            <Button
              onClick={() => {
                setEditingProjectIndex(null);
                setProjectForm({
                  projectName: "",
                  healthcareOrganization: "",
                  category: "Critical Care / ICU Equipment",
                  approximateValue: 500000,
                  year: new Date().getFullYear() - 1,
                });
                setShowProjectModal(true);
              }}
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Project Reference
            </Button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white text-xs">
            {formData.previousProjects?.map((proj, idx) => (
              <div
                key={proj.id || idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-[#0F2747]">
                      {proj.projectName}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-[#2F80ED] font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {proj.category}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">{proj.healthcareOrganization}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-sm text-[#0F2747]">
                      {formatFullCurrency(proj.approximateValue)}
                    </div>
                    <div className="text-[11px] text-slate-500">Completed in {proj.year}</div>
                  </div>

                  <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                    <button
                      onClick={() => {
                        setEditingProjectIndex(idx);
                        setProjectForm(proj);
                        setShowProjectModal(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProductIndex !== null ? "Edit Medical Product" : "Add Product to Catalog"}
        subtitle="Catalog specifications are matched against incoming tender requirements"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Product / Device Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. ApexBreathe Pro-X ICU Ventilator"
              className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Clinical Category</label>
            <select
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Technical Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="e.g. Dual invasive and non-invasive ventilation with high-flow oxygen and battery backup..."
              className="w-full p-2 border border-slate-300 rounded text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Certifications & Regulatory Status
            </label>
            <input
              type="text"
              value={productForm.certifications}
              onChange={(e) => setProductForm({ ...productForm, certifications: e.target.value })}
              placeholder="e.g. MDR Class IIb Certified (CE 0123), UKCA"
              className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowProductModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD / EDIT CERTIFICATION */}
      <Modal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        title={
          editingCertIndex !== null ? "Edit Certification" : "Add Regulatory Certification"
        }
        subtitle="Audited standards verify compliance with NHS and European procurement rules"
      >
        <form onSubmit={handleSaveCert} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Standard / Certification Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={certForm.name}
              onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
              placeholder="e.g. ISO 13485:2016 Medical Devices QMS"
              className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Certificate Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={certForm.certificateNumber}
                onChange={(e) => setCertForm({ ...certForm, certificateNumber: e.target.value })}
                placeholder="e.g. MD 782910-UK"
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Issuing Body / Notified Body <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={certForm.issuingBody}
                onChange={(e) => setCertForm({ ...certForm, issuingBody: e.target.value })}
                placeholder="e.g. BSI Group / TÜV SÜD"
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Issue Date</label>
              <input
                type="date"
                required
                value={certForm.issueDate}
                onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Expiry Date</label>
              <input
                type="date"
                required
                value={certForm.expiryDate}
                onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCertModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Certification
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD / EDIT PREVIOUS PROJECT */}
      <Modal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title={
          editingProjectIndex !== null ? "Edit Hospital Project" : "Add Previous Project"
        }
        subtitle="Recorded past contracts are evaluated during competitive framework scoring"
      >
        <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Project / Contract Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={projectForm.projectName}
              onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })}
              placeholder="e.g. ICU Ventilator Fleet Replacement & 4-Yr Maintenance"
              className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Healthcare Organization / Hospital Trust <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={projectForm.healthcareOrganization}
              onChange={(e) =>
                setProjectForm({ ...projectForm, healthcareOrganization: e.target.value })
              }
              placeholder="e.g. Guys and St Thomas NHS Foundation Trust"
              className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Category</label>
              <select
                value={projectForm.category}
                onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Completion Year</label>
              <input
                type="number"
                required
                min={2000}
                max={2030}
                value={projectForm.year}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, year: Number(e.target.value) })
                }
                className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Approximate Contract Value (£) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1000}
              value={projectForm.approximateValue}
              onChange={(e) =>
                setProjectForm({ ...projectForm, approximateValue: Number(e.target.value) })
              }
              className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowProjectModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Project Reference
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
