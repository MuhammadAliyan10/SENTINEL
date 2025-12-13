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
    is_paid as payment_status, -- Map is_paid to payment_status for compatibility if needed
    profile_photo_url as photo_url,
    created_at,
    updated_at
FROM public.users; -- Updated to users

-- Grant access to the safe view
GRANT SELECT ON public.profiles_safe TO authenticated;

-- ============================================
-- STEP 2: Ensure SAP ID Column Exists
-- (Handled by Prisma, skipping DDL)
-- ============================================

-- ============================================
-- STEP 4: Update Views to Use SAP ID
-- ============================================

DROP VIEW IF EXISTS public.v_entry_logs_detailed;

CREATE OR REPLACE VIEW public.v_entry_logs_detailed AS
SELECT
    el.id,
    el.timestamp as scanned_at, -- Map timestamp to scanned_at
    el.status,
    el.scanner_id as guard_device_id, -- Map scanner_id
    el.gate_number as location, -- Map gate_number
    el.metadata as notes, -- Map metadata
    p.full_name,
    p.sap_id,
    p.profile_photo_url as photo_url,
    p.is_paid as payment_status
FROM public.access_logs el -- Updated to access_logs
JOIN public.users p ON el.user_id = p.id
ORDER BY el.timestamp DESC;

GRANT SELECT ON public.v_entry_logs_detailed TO authenticated;

-- ============================================
-- DONE
-- ============================================
