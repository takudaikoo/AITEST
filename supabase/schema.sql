-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Departments Table
create table departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles Table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text, -- Added 2026-01-18
  role text default 'user' check (role in ('user', 'admin')),
  department_id uuid references departments(id),
  rank text default 'Beginner',
  xp integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Programs Table (Was Exams - now covers Tests, Exams, Lectures)
create table programs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  type text not null check (type in ('test', 'exam', 'lecture')), -- 3 types
  category text,
  time_limit integer, -- in minutes, optional for lectures
  passing_score integer default 80, -- optional for lectures
  is_active boolean default true,
  
  content_body text, -- Markdown content or video embed code
  
  -- Schedule
  start_date timestamp with time zone,
  end_date timestamp with time zone,

  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Questions Table
create table questions (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  question_type text default 'single_choice' check (question_type in ('single_choice', 'multiple_choice', 'text')),
  explanation text,
  resource_url text,
  
  phase integer check (phase between 1 and 7),
  difficulty integer check (difficulty between 1 and 5),
  
  -- New fields for detailed learning path
  points integer default 10,
  review_program_id uuid references programs(id), -- Recommended lecture if failed
  
  -- New fields for Question Import and Management (2026-01-16)
  tags text[], -- Array of tags
  category text, -- High level grouping
  image_url text, -- For visual questions

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Program-Questions Join Table (Many-to-Many)
create table program_questions (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid references programs(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  question_number integer not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(program_id, question_id),
  unique(program_id, question_number)
);

-- Options Table
create table options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references questions(id) on delete cascade not null,
  text text not null,
  is_correct boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Learning History (Was Exam Attempts) - The History DB
create table learning_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  program_id uuid references programs(id) on delete cascade not null,
  
  -- Snapshot of program details at time of taking (optional but good for history)
  program_snapshot_type text, 
  
  score integer, -- Nullable for lectures
  is_passed boolean,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned'))
);

-- User Answers
create table user_answers (
  id uuid primary key default uuid_generate_v4(),
  history_id uuid references learning_history(id) on delete cascade not null,
  question_id uuid references questions(id) not null,
  selected_option_id uuid references options(id),
  text_answer text,
  is_correct boolean,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Weaknesses
create table weaknesses (
  user_id uuid references profiles(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  failure_count integer default 1,
  last_failed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, question_id)
);

-- RLS Policies

alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

alter table programs enable row level security;
create policy "Active programs are viewable by everyone" on programs for select using (is_active = true);
create policy "Admins can do everything with programs" on programs for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

alter table questions enable row level security;
create policy "Viewable by everyone" on questions for select using (true);
create policy "Admins manage questions" on questions for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

alter table program_questions enable row level security;
create policy "Viewable by everyone" on program_questions for select using (true);
create policy "Admins manage program_questions" on program_questions for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

alter table options enable row level security;
create policy "Viewable by everyone" on options for select using (true);
create policy "Admins manage options" on options for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

alter table learning_history enable row level security;
create policy "Users manage own history" on learning_history for all using (auth.uid() = user_id);
create policy "Admins view all history" on learning_history for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

alter table user_answers enable row level security;
create policy "Users manage own answers" on user_answers for all using (
  exists (select 1 from learning_history where id = history_id and user_id = auth.uid())
);
create policy "Admins view all answers" on user_answers for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Auth Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, created_at)
  values (new.id, new.email, 'user', now());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
