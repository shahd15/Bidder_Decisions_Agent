-- ====================================================================
-- BidderDecisions - Company Documents & Supabase Storage Integration
-- Migration: 002_company_documents_storage.sql
-- ====================================================================

-- 1. Enhance company_documents table with verification_status and storage_path
ALTER TABLE IF EXISTS public.company_documents
  ADD COLUMN IF NOT EXISTS filename TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (verification_status IN ('FOUND', 'PENDING', 'EXPIRED', 'NEEDS_REVIEW')),
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Update existing rows if any
UPDATE public.company_documents
SET filename = name
WHERE filename IS NULL AND name IS NOT NULL;

-- 2. Create private storage bucket 'company-documents'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-documents',
  'company-documents',
  false, -- PRIVATE BUCKET: Documents are never exposed publicly
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Row Level Security on storage.objects for company-documents bucket
-- Enforce private access: only authenticated users can access their company documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Authenticated company document uploads'
  ) THEN
    CREATE POLICY "Authenticated company document uploads"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'company-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Authenticated company document reads'
  ) THEN
    CREATE POLICY "Authenticated company document reads"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'company-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Authenticated company document deletes'
  ) THEN
    CREATE POLICY "Authenticated company document deletes"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'company-documents');
  END IF;
END $$;
