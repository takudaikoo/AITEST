-- Create a new storage bucket for lecture assets
insert into storage.buckets (id, name, public)
values ('lecture-assets', 'lecture-assets', true);

-- Policy: Allow public access to view files
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'lecture-assets' );

-- Policy: Allow authenticated users (Admins) to upload files
-- Assuming 'authenticated' role is sufficient for now, or check for specific admin claim if needed.
-- For simplicity in this context, allowing authenticated users to insert/update/delete.
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'lecture-assets' and auth.role() = 'authenticated' );

create policy "Authenticated users can update"
  on storage.objects for update
  using ( bucket_id = 'lecture-assets' and auth.role() = 'authenticated' );

create policy "Authenticated users can delete"
  on storage.objects for delete
  using ( bucket_id = 'lecture-assets' and auth.role() = 'authenticated' );
