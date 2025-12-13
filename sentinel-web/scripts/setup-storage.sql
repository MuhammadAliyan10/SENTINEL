-- ==========================================
-- SUPABASE STORAGE SETUP (CORRECTED)
-- ==========================================

-- 1. Create Buckets (if they don't exist)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('id-cards', 'id-cards', true)
on conflict (id) do nothing;

-- NOTE: We removed the "ALTER TABLE" command because RLS is already enabled by default.

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Drop existing policies to prevent "Policy already exists" errors if you run this twice
drop policy if exists "Public Access Avatars" on storage.objects;
drop policy if exists "Authenticated Upload Avatars" on storage.objects;
drop policy if exists "Public Access ID Cards" on storage.objects;
drop policy if exists "Authenticated Upload ID Cards" on storage.objects;

-- AVATARS: Public Read, Auth Insert
create policy "Public Access Avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Authenticated Upload Avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

-- ID CARDS: Public Read, Auth Insert
create policy "Public Access ID Cards"
  on storage.objects for select
  using ( bucket_id = 'id-cards' );

create policy "Authenticated Upload ID Cards"
  on storage.objects for insert
  with check (
    bucket_id = 'id-cards'
    and auth.role() = 'authenticated'
  );
