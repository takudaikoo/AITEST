-- Enable RLS for public.departments
alter table public.departments enable row level security;

-- Policy: Allow Read Access for All Authenticated Users
-- Needed so users can see department names in their profile or selection lists
create policy "Allow read access for authenticated users"
on public.departments
for select
to authenticated
using (true);

-- Policy: Allow Write Access (Insert, Update, Delete) for Admins Only
-- Checks the profiles table for the admin role
create policy "Allow write access for admins"
on public.departments
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
