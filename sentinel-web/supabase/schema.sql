-- ============================================
-- SENTINEL ACCESS CONTROL SYSTEM
-- Supabase Database Schema
-- ============================================
-- Run this in the Supabase SQL Editor

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOM TYPES
-- ============================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'student', 'guard');

-- Entry status enum
CREATE TYPE entry_status AS ENUM ('allowed', 'rejected', 're-entry');

-- ============================================
-- PROFILES TABLE
-- Linked to Supabase auth.users
-- ============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    student_id TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    payment_status BOOLEAN NOT NULL DEFAULT false,
    photo_url TEXT,
    totp_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ENTRY LOGS TABLE
-- Tracks all gate scans
-- ============================================

CREATE TABLE public.entry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status entry_status NOT NULL,
    guard_device_id TEXT,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_entry_logs_user_id ON public.entry_logs(user_id);
CREATE INDEX idx_entry_logs_scanned_at ON public.entry_logs(scanned_at DESC);
CREATE INDEX idx_entry_logs_status ON public.entry_logs(status);

-- Enable RLS
ALTER TABLE public.entry_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- ----- PROFILES POLICIES -----

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Students can view their own profile
CREATE POLICY "Students can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Students can update their own photo
CREATE POLICY "Students can update own photo"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Guards can view profiles (for verification during scans)
CREATE POLICY "Guards can view profiles for verification"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'guard'
        )
    );

-- ----- ENTRY LOGS POLICIES -----

-- Admins can view all entry logs
CREATE POLICY "Admins can view all entry logs"
    ON public.entry_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Guards can insert entry logs
CREATE POLICY "Guards can insert entry logs"
    ON public.entry_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'guard'
        )
    );

-- Guards can view entry logs they created
CREATE POLICY "Guards can view own entry logs"
    ON public.entry_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'guard'
        )
    );

-- Students can view their own entry logs
CREATE POLICY "Students can view own entry logs"
    ON public.entry_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update profiles.updated_at on change
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function: Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    generated_secret TEXT;
BEGIN
    -- Generate a random TOTP secret (32 chars base32)
    generated_secret := encode(gen_random_bytes(20), 'base64');
    generated_secret := replace(generated_secret, '+', 'A');
    generated_secret := replace(generated_secret, '/', 'B');
    generated_secret := replace(generated_secret, '=', '');
    generated_secret := upper(substring(generated_secret from 1 for 32));

    INSERT INTO public.profiles (id, full_name, totp_secret, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        generated_secret,
        'student'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VIEWS (Optional: Pre-built queries)
-- ============================================

-- View: Today's entry summary
CREATE OR REPLACE VIEW public.v_today_entries AS
SELECT
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE status = 'allowed') as allowed_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE status = 're-entry') as reentry_count
FROM public.entry_logs
WHERE scanned_at >= CURRENT_DATE;

-- View: Entry logs with user details (for admin dashboard)
CREATE OR REPLACE VIEW public.v_entry_logs_detailed AS
SELECT
    el.id,
    el.scanned_at,
    el.status,
    el.guard_device_id,
    el.location,
    el.notes,
    p.full_name,
    p.student_id,
    p.photo_url,
    p.payment_status
FROM public.entry_logs el
JOIN public.profiles p ON el.user_id = p.id
ORDER BY el.scanned_at DESC;

-- Grant access to views
GRANT SELECT ON public.v_today_entries TO authenticated;
GRANT SELECT ON public.v_entry_logs_detailed TO authenticated;

-- ============================================
-- SEED DATA (Optional: Remove in production)
-- ============================================

-- Uncomment to add a test admin after creating the auth user
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR-ADMIN-USER-UUID';

-- ============================================
-- DONE
-- ============================================
