import React, { useState, useEffect } from "react";
import { procurementDb } from "./lib/supabase";
import { fetchRealTenders } from "./lib/supabase/tender-service";
import {
  TenderOpportunity,
  CompanyProfile,
  ComplianceCertificate,
  ProcurementTask,
  BidPackage,
} from "./types/procurement";
import { Sidebar, ActiveTab } from "./components/layout/Sidebar";
import { TopNavigation } from "./components/layout/TopNavigation";
import { DashboardView } from "./components/dashboard/DashboardView";
import { OpportunitiesView } from "./components/opportunities/OpportunitiesView";
import { CompanyView } from "./components/company/CompanyView";
import { ComplianceView } from "./components/compliance/ComplianceView";
import { TasksView } from "./components/tasks/TasksView";
import { BidPackagesView } from "./components/bidpackages/BidPackagesView";
import { DocumentsView } from "./components/documents/DocumentsView";
import { TenderUploadView } from "./components/tenders/TenderUploadView";
import { TenderDetailModal } from "./components/modals/TenderDetailModal";
import { ImportTenderModal } from "./components/modals/ImportTenderModal";
import { AuthProvider, useAuth } from "./lib/supabase/auth-context";
import { ProtectedDashboardRoute } from "./components/auth/ProtectedDashboardRoute";
import { AuthModal } from "./components/auth/AuthModal";

function DashboardApp() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Global filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");

  // Procurement Database State
  const [opportunities, setOpportunities] = useState<TenderOpportunity[]>([]);
  const [tasks, setTasks] = useState<ProcurementTask[]>([]);
  const [certificates, setCertificates] = useState<ComplianceCertificate[]>([]);
  const [bidPackages, setBidPackages] = useState<BidPackage[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(
    procurementDb.getCompanyProfile()
  );

  // Modal States
  const [selectedOpportunity, setSelectedOpportunity] = useState<TenderOpportunity | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load Initial Data
  useEffect(() => {
    setOpportunities(procurementDb.getOpportunities());
    setTasks(procurementDb.getTasks());
    setCertificates(procurementDb.getCertificates());
    setBidPackages(procurementDb.getBidPackages());
    setCompanyProfile(procurementDb.getCompanyProfile());

    // Fetch real tenders from Supabase database
    fetchRealTenders().then((data) => {
      if (data && data.length > 0) {
        setOpportunities(data);
      }
    });
  }, []);

  // Handlers
  const handleSelectOpportunity = (opp: TenderOpportunity) => {
    setSelectedOpportunity(opp);
  };

  const handleUpdateOpportunityStatus = (
    id: string,
    status: TenderOpportunity["status"]
  ) => {
    procurementDb.updateOpportunityStatus(id, status);
    const updated = procurementDb.getOpportunities();
    setOpportunities(updated);
    if (selectedOpportunity && selectedOpportunity.id === id) {
      const refreshed = updated.find((o) => o.id === id) || null;
      setSelectedOpportunity(refreshed);
    }
  };

  const handleToggleTask = (taskId: string) => {
    procurementDb.toggleTask(taskId);
    setTasks(procurementDb.getTasks());
  };

  const handleAddTask = (newTask: ProcurementTask) => {
    procurementDb.addTask(newTask);
    setTasks(procurementDb.getTasks());
  };

  const handleAddCertificate = (newCert: ComplianceCertificate) => {
    procurementDb.addCertificate(newCert);
    setCertificates(procurementDb.getCertificates());
  };

  const handleUpdateProfile = (newProfile: CompanyProfile) => {
    procurementDb.updateCompanyProfile(newProfile);
    setCompanyProfile(newProfile);
  };

  const handleImportComplete = (newOpp: TenderOpportunity) => {
    procurementDb.addOpportunity(newOpp);
    setOpportunities(procurementDb.getOpportunities());
    setSelectedOpportunity(newOpp);
  };

  const handleOpenBidPackageFromDetail = (opp: TenderOpportunity) => {
    setSelectedOpportunity(null);
    setActiveTab("bid-packages");
  };

  const handleAddTaskFromDetail = (opp: TenderOpportunity) => {
    setSelectedOpportunity(null);
    setActiveTab("tasks");
  };

  const openTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F2747] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openTasksCount={openTasksCount}
        activeOpportunitiesCount={opportunities.length}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        companyName={companyProfile.name}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navigation */}
        <TopNavigation
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSector={selectedSector}
          setSelectedSector={setSelectedSector}
        />

        {/* Dynamic View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && (
            <DashboardView
              opportunities={opportunities}
              tasks={tasks}
              certificates={certificates}
              bidPackages={bidPackages}
              onSelectOpportunity={handleSelectOpportunity}
              setActiveTab={setActiveTab}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onToggleTask={handleToggleTask}
            />
          )}

          {activeTab === "opportunities" && (
            <OpportunitiesView
              opportunities={opportunities}
              onSelectOpportunity={handleSelectOpportunity}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              initialSectorFilter={selectedSector}
              onRefreshOpportunities={setOpportunities}
            />
          )}

          {activeTab === "upload-tender" && (
            <TenderUploadView
              onTenderCreated={(opp) => {
                setOpportunities(procurementDb.getOpportunities());
                setSelectedOpportunity(opp);
              }}
              onNavigateToTenders={() => setActiveTab("opportunities")}
              onNavigateToDetail={(opp) => setSelectedOpportunity(opp)}
            />
          )}

          {activeTab === "documents" && <DocumentsView />}

          {activeTab === "company" && (
            <CompanyView
              profile={companyProfile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === "compliance" && (
            <ComplianceView
              certificates={certificates}
              onAddCertificate={handleAddCertificate}
            />
          )}

          {activeTab === "tasks" && (
            <TasksView
              tasks={tasks}
              opportunities={opportunities}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
            />
          )}

          {activeTab === "bid-packages" && (
            <BidPackagesView bidPackages={bidPackages} />
          )}
        </main>
      </div>

      {/* Tender Detail Modal */}
      <TenderDetailModal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onUpdateStatus={handleUpdateOpportunityStatus}
        onOpenBidPackage={handleOpenBidPackageFromDetail}
        onAddTask={handleAddTaskFromDetail}
      />

      {/* Import Tender Modal */}
      <ImportTenderModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
        onNavigateToUpload={() => setActiveTab("upload-tender")}
      />

      {/* Supabase User & RLS Session Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedDashboardRoute>
        <DashboardApp />
      </ProtectedDashboardRoute>
    </AuthProvider>
  );
}
