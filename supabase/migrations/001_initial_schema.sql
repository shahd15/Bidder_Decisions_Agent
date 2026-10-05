-- ====================================================================
-- BidderDecisions - Healthcare SME AI Procurement Platform
-- Migration: 001_initial_schema.sql
-- Description: Core schema with UUIDs, RLS, and company isolation
-- ====================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. COMPANIES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_type TEXT DEFAULT 'Medical Equipment Supplier',
  description TEXT,
  location TEXT,
  preferred_regions TEXT[] DEFAULT ARRAY[]::TEXT[],
  min_contract_value NUMERIC(15, 2) DEFAULT 0,
  max_contract_value NUMERIC(15, 2) DEFAULT 0,
  annual_contract_capacity NUMERIC(15, 2) DEFAULT 0,
  previous_projects JSONB DEFAULT '[]'::jsonb,
  legal_entity TEXT,
  registration_number TEXT,
  sme_classification TEXT CHECK (sme_classification IN ('Small', 'Medium', 'Micro-enterprise')),
  founded_year INTEGER,
  headquarters TEXT,
  sectors TEXT[] DEFAULT ARRAY[]::TEXT[],
  annual_turnover NUMERIC(15, 2) DEFAULT 0,
  bonding_capacity NUMERIC(15, 2) DEFAULT 0,
  quality_manager TEXT,
  bid_director TEXT,
  capabilities_summary TEXT,
  facilities TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 2. PROFILES TABLE (Linked to auth.users)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'Commercial Bid Manager',
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Helper function to retrieve authenticated user's company_id
CREATE OR REPLACE FUNCTION public.auth_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- --------------------------------------------------------------------
-- 3. PRODUCTS TABLE (Medical devices, equipment catalog)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  certifications TEXT,
  ce_mark_mdr_status TEXT,
  gdp_certified BOOLEAN DEFAULT false,
  lead_time_weeks INTEGER DEFAULT 2,
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);

-- --------------------------------------------------------------------
-- 4. CERTIFICATIONS TABLE (ISO 13485, MDR, DSPT, GDP)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  standard TEXT,
  issuer TEXT,
  issuing_body TEXT NOT NULL,
  certificate_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  valid_from DATE,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired')),
  applicable_sectors TEXT[] DEFAULT ARRAY[]::TEXT[],
  document_url TEXT,
  file_size TEXT,
  verified_by_audit BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_certifications_company_id ON public.certifications(company_id);

-- --------------------------------------------------------------------
-- 5. COMPANY_DOCUMENTS TABLE (Evidence Vault)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON public.company_documents(company_id);

-- --------------------------------------------------------------------
-- 6. TENDERS TABLE (Healthcare RFPs & Frameworks)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reference_code TEXT NOT NULL,
  title TEXT NOT NULL,
  contracting_authority TEXT NOT NULL,
  authority_type TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'UK',
  sector TEXT NOT NULL,
  cpv_code TEXT NOT NULL,
  publication_date DATE NOT NULL DEFAULT CURRENT_DATE,
  submission_deadline DATE NOT NULL,
  clarification_deadline DATE,
  contract_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP' CHECK (currency IN ('GBP', 'EUR', 'USD')),
  contract_duration_months INTEGER NOT NULL DEFAULT 12,
  status TEXT NOT NULL DEFAULT 'new_tender' CHECK (status IN ('new_tender', 'under_review', 'bid_approved', 'bid_declined', 'drafting_submission', 'submitted')),
  framework_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tenders_company_id ON public.tenders(company_id);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON public.tenders(status);

-- --------------------------------------------------------------------
-- 7. TENDER_REQUIREMENTS TABLE (Extracted specifications)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tender_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  mandatory BOOLEAN NOT NULL DEFAULT true,
  company_match_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (company_match_status IN ('compliant', 'conditional', 'missing', 'pending_review')),
  matching_evidence TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tender_requirements_tender_id ON public.tender_requirements(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_requirements_company_id ON public.tender_requirements(company_id);

-- --------------------------------------------------------------------
-- 8. BID_ASSESSMENTS TABLE (AI Scores & Risk Analysis)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bid_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL UNIQUE REFERENCES public.tenders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  decision TEXT NOT NULL CHECK (decision IN ('RECOMMENDED BID', 'CONDITIONAL BID', 'NO-BID / HIGH RISK')),
  decision_rationale TEXT NOT NULL,
  score_technical INTEGER NOT NULL DEFAULT 0,
  score_regulatory INTEGER NOT NULL DEFAULT 0,
  score_commercial INTEGER NOT NULL DEFAULT 0,
  score_past_performance INTEGER NOT NULL DEFAULT 0,
  score_delivery_sla INTEGER NOT NULL DEFAULT 0,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  assessed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bid_assessments_tender_id ON public.bid_assessments(tender_id);
CREATE INDEX IF NOT EXISTS idx_bid_assessments_company_id ON public.bid_assessments(company_id);

-- --------------------------------------------------------------------
-- 9. TASKS TABLE (Procurement Action Plan & RFIs)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES public.tenders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Clarification RFI', 'Technical Gap', 'Regulatory Evidence', 'Pricing Model', 'Executive Sign-Off')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium')),
  due_date DATE NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tender_id ON public.tasks(tender_id);

-- --------------------------------------------------------------------
-- 10. BID_PACKAGES TABLE (First-Draft Submissions)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bid_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT 'v1.0',
  status TEXT NOT NULL DEFAULT 'drafting' CHECK (status IN ('drafting', 'internal_review', 'ready_for_export')),
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  compliance_score INTEGER NOT NULL DEFAULT 0,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bid_packages_company_id ON public.bid_packages(company_id);
CREATE INDEX IF NOT EXISTS idx_bid_packages_tender_id ON public.bid_packages(tender_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users can only access data belonging to their company
-- ====================================================================

-- 1. Companies RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company"
  ON public.companies FOR SELECT
  USING (id = public.auth_company_id());

CREATE POLICY "Users can update their own company"
  ON public.companies FOR UPDATE
  USING (id = public.auth_company_id())
  WITH CHECK (id = public.auth_company_id());

-- 2. Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles in their company"
  ON public.profiles FOR SELECT
  USING (company_id = public.auth_company_id() OR id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their profile on signup"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- 3. Products RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access products for their company"
  ON public.products FOR ALL
  USING (company_id = public.auth_company_id())
  WITH CHECK (company_id = public.auth_company_id());

-- 4. Certifications RLS
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access certifications for their company"
  ON public.certifications FOR ALL
  USING (company_id = public.auth_company_id())
  WITH CHECK (company_id = public.auth_company_id());

-- 5. Company Documents RLS
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access documents for their company"
  ON public.company_documents FOR ALL
  USING (company_id = public.auth_company_id())
  WITH CHECK (company_id = public.auth_company_id());

-- 6. Tenders RLS
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access tenders for their company"
  ON public.tenders FOR ALL
  USING (company_id = public.auth_company_id())
  WITH CHECK (company_id = public.auth_company_id());

-- 7. Tender Requirements RLS
ALTER TABLE public.tender_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access tender requirements for their company"
  ON public.tender_requirements FOR ALL
  USING (company_id = public.auth_company_id())
  WITH CHECK (company_id = public.auth_company_id());

-- 8. Bid Assessments RLS
ALTER TABLE public.bid_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access bid assessments for their company"
  ON public.bid_assessments FOR ALL
  USING (company_id = public.auth_company_id())
  WITH CHECK (company_id = public.auth_company_id());

-- 9. Tasks RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access tasks for their company"
  ON public.tasks FOR ALL
  USING (company_id = public.auth_company_id())
  WITH CHECK (company_id = public.auth_company_id());

-- 10. Bid Packages RLS
ALTER TABLE public.bid_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access bid packages for their company"
  ON public.bid_packages FOR ALL
  USING (company_id = public.auth_company_id())
  WITH CHECK (company_id = public.auth_company_id());

-- --------------------------------------------------------------------
-- TRIGGER FOR AUTO-CREATING PROFILE ON AUTH SIGNUP
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_company_id UUID;
BEGIN
  -- Link or create default company if none exists
  SELECT id INTO default_company_id FROM public.companies LIMIT 1;
  
  IF default_company_id IS NULL THEN
    INSERT INTO public.companies (name, sme_classification)
    VALUES ('My Healthcare SME Ltd', 'Medium')
    RETURNING id INTO default_company_id;
  END IF;

  INSERT INTO public.profiles (id, company_id, full_name, email, role)
  VALUES (
    NEW.id,
    default_company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Commercial Bid Lead')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
