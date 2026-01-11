-- Employee Master Table (For Pre-registration)
-- Admins populate this. When a user signs up with a matching email, 
-- their Profile is created using this data.

create table employee_master (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  department_name text, -- To be matched with departments table or inserted
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Admin only
alter table employee_master enable row level security;
create policy "Admins manage employee_master" on employee_master for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Update trigger to look up employee_master
create or replace function public.handle_new_user()
returns trigger as $$
declare
  master_record record;
  dept_id uuid;
begin
  -- Check if email exists in employee_master
  select * into master_record from public.employee_master where email = new.email;
  
  -- If found, verify department and create profile
  if found then
    -- Find department (upsert logic simple for now: find or create?) 
    -- Typically master has valid dept names.
    select id into dept_id from public.departments where name = master_record.department_name;
    
    -- If dept not found, can insert it or leave null? Lets insert for robustness
    if dept_id is null and master_record.department_name is not null then
      insert into public.departments (name) values (master_record.department_name) returning id into dept_id;
    end if;

    insert into public.profiles (id, email, role, department_id, created_at)
    values (new.id, new.email, 'user', dept_id, now());
    
  else
    -- Standard fallback (or deny? User requested "We prepare DB", so deny fallback might be better but lets keep fallback for generic admins)
    insert into public.profiles (id, email, role, created_at)
    values (new.id, new.email, 'user', now());
  end if;

  return new;
end;
$$ language plpgsql security definer;
