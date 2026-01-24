-- Ensure RLS is enabled (or at least safe) and Admins can view all data for Analytics

-- 1. Profiles: Admins need to see all profiles for analytics
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Note: Users usually can view their own profile.
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- 2. Learning History: Admins need to see all history
ALTER TABLE public.learning_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all learning history"
ON public.learning_history
FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view own learning history"
ON public.learning_history
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- 3. Weaknesses (if exists) - assuming it's a view or table
-- If it's a table, enable RLS. If it's missing, this might error if run, so wrapping in do block or ignored.
-- Attempting to just create policy if table exists:
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'weaknesses') THEN
        ALTER TABLE public.weaknesses ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Admins can view weaknesses"
        ON public.weaknesses
        FOR SELECT
        TO authenticated
        USING (
            exists (
                select 1 from public.profiles
                where profiles.id = auth.uid()
                and profiles.role = 'admin'
            )
        );
    END IF;
END
$$;
