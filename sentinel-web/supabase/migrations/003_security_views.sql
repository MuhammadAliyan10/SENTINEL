-- ============================================
-- SENTINEL ACCESS CONTROL SYSTEM
-- Migration: Security Views & SAP ID Updates
-- ============================================
-- Run this in the Supabase SQL Editor

-- ============================================
-- STEP 1: Create Safe Profile View
-- This view excludes sensitive data (totp_secret)
-- ============================================

DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe AS
SELECT
    id,
    full_name,
    sap_id,
    role,
    payment_status,
    photo_url,
    created_at,
    updated_at
FROM public.profiles;

-- Grant access to the safe view
GRANT SELECT ON public.profiles_safe TO authenticated;

-- ============================================
-- STEP 2: Ensure SAP ID Column Exists
-- (Skip if already renamed from student_id)
-- ============================================

-- Check if student_id column exists and rename to sap_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'student_id'
    ) THEN
        ALTER TABLE public.profiles RENAME COLUMN student_id TO sap_id;
        RAISE NOTICE 'Renamed student_id to sap_id';
    ELSE
        RAISE NOTICE 'Column sap_id already exists';
    END IF;
END $$;

-- ============================================
-- STEP 3: Add Constraints to SAP ID
-- ============================================

-- Make sap_id NOT NULL (update any NULL values first)
UPDATE public.profiles
SET sap_id = 'TEMP-' || id::text
WHERE sap_id IS NULL;

-- Add NOT NULL constraint
ALTER TABLE public.profiles
ALTER COLUMN sap_id SET NOT NULL;

-- Add UNIQUE constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_sap_id_unique'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_sap_id_unique UNIQUE (sap_id);
        RAISE NOTICE 'Added unique constraint to sap_id';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;

-- Create index for faster lookups
DROP INDEX IF EXISTS idx_profiles_student_id;
CREATE INDEX IF NOT EXISTS idx_profiles_sap_id ON public.profiles(sap_id);

-- ============================================
-- STEP 4: Update Views to Use SAP ID
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
