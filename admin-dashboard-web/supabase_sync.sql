-- 1. Create or Update the students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  registration_number TEXT UNIQUE,
  department TEXT,
  level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table already existed
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES public.levels(id);

-- 2. Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow anyone with an anon key to read (for the dashboard)
-- NOTE: In production, you'd restrict this to authenticated admins
DROP POLICY IF EXISTS "Allow public read access" ON public.students;
CREATE POLICY "Allow public read access" ON public.students
  FOR SELECT USING (true);

-- 4. Create a policy to allow the system to insert/update
DROP POLICY IF EXISTS "Allow system manage" ON public.students;
CREATE POLICY "Allow system manage" ON public.students
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Create the sync function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_department_id UUID;
  v_level_id UUID;
BEGIN
  -- Only sync if the user role is 'student'
  IF (new.raw_user_meta_data->>'role') = 'student' THEN
    -- Try to get IDs directly from metadata
    v_department_id := (new.raw_user_meta_data->>'department_id')::UUID;
    v_level_id := (new.raw_user_meta_data->>'level_id')::UUID;

    -- If not in metadata, look them up by name
    IF v_department_id IS NULL THEN
      SELECT id INTO v_department_id FROM public.departments WHERE name = (new.raw_user_meta_data->>'department') LIMIT 1;
    END IF;

    IF v_level_id IS NULL AND v_department_id IS NOT NULL THEN
      SELECT id INTO v_level_id FROM public.levels WHERE label = (new.raw_user_meta_data->>'level') AND department_id = v_department_id LIMIT 1;
    END IF;

    INSERT INTO public.students (id, full_name, email, registration_number, department, level, department_id, level_id)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.email,
      new.raw_user_meta_data->>'reg_no',
      new.raw_user_meta_data->>'department',
      new.raw_user_meta_data->>'level',
      v_department_id,
      v_level_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Set up the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Sync existing users (one-time) - ONLY students
DO $$
DECLARE
  r RECORD;
  v_dept_id UUID;
  v_lvl_id UUID;
BEGIN
  FOR r IN 
    SELECT id, raw_user_meta_data FROM auth.users WHERE (raw_user_meta_data->>'role') = 'student'
  LOOP
    -- Try to get IDs directly from metadata
    v_dept_id := (r.raw_user_meta_data->>'department_id')::UUID;
    v_lvl_id := (r.raw_user_meta_data->>'level_id')::UUID;

    -- If not in metadata, look them up by name
    IF v_dept_id IS NULL THEN
      SELECT id INTO v_dept_id FROM public.departments WHERE name = (r.raw_user_meta_data->>'department') LIMIT 1;
    END IF;

    IF v_lvl_id IS NULL AND v_dept_id IS NOT NULL THEN
      SELECT id INTO v_lvl_id FROM public.levels WHERE label = (r.raw_user_meta_data->>'level') AND department_id = v_dept_id LIMIT 1;
    END IF;

    INSERT INTO public.students (id, full_name, email, registration_number, department, level, department_id, level_id)
    VALUES (
      r.id,
      r.raw_user_meta_data->>'full_name',
      (SELECT email FROM auth.users WHERE id = r.id),
      r.raw_user_meta_data->>'reg_no',
      r.raw_user_meta_data->>'department',
      r.raw_user_meta_data->>'level',
      v_dept_id,
      v_lvl_id
    )
    ON CONFLICT (id) DO UPDATE SET
      department_id = EXCLUDED.department_id,
      level_id = EXCLUDED.level_id;
  END LOOP;
END $$;
