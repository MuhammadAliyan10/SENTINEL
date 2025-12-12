-- ============================================
-- SENTINEL ACCESS CONTROL SYSTEM
-- Migration: SAP ID Enforcement
-- ============================================
-- Run this in the Supabase SQL Editor AFTER the initial schema

-- Step 1: Rename student_id column to sap_id
ALTER TABLE public.profiles
RENAME COLUMN student_id TO sap_id;

-- Step 2: Make sap_id NOT NULL (with a temporary default for existing rows)
-- First, update any NULL values with a placeholder
UPDATE public.profiles
SET sap_id = 'TEMP-' || id::text
WHERE sap_id IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE public.profiles
ALTER COLUMN sap_id SET NOT NULL;

-- Step 4: Add UNIQUE constraint
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_sap_id_unique UNIQUE (sap_id);

-- Step 5: Update the index name for clarity
DROP INDEX IF EXISTS idx_profiles_student_id;
CREATE INDEX idx_profiles_sap_id ON public.profiles(sap_id);

-- Step 6: Add a CHECK constraint to ensure SAP ID format (8 digits)
-- This ensures SAP IDs like '70168915' are properly formatted
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_sap_id_format
CHECK (sap_id ~ '^[0-9]{8}$' OR sap_id ~ '^TEMP-');

-- Note: Remove the TEMP- exception in production after all data is migrated

-- ============================================
-- Update the view to use sap_id
-- ============================================

DROP VIEW IF EXISTS public.v_entry_logs_detailed;

CREATE OR REPLACE VIEW public.v_entry_logs_detailed AS
SELECT
    el.id,
    el.scanned_at,
    el.status,
    el.guard_device_id,
    el.location,
    el.notes,
    p.full_name,
    p.sap_id,
    p.photo_url,
    p.payment_status
FROM public.entry_logs el
JOIN public.profiles p ON el.user_id = p.id
ORDER BY el.scanned_at DESC;

GRANT SELECT ON public.v_entry_logs_detailed TO authenticated;

-- ============================================
-- DONE
-- ============================================
