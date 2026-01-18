-- Add full_name column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;

-- Update handle_new_user trigger to default to 'user' instead of 'admin'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at)
  VALUES (new.id, new.email, 'user', NOW());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
