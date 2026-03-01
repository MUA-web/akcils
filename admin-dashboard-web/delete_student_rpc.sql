-- Function to delete a student completely, including their authentication profile
-- Run this in your Supabase SQL Editor (replace existing version)

CREATE OR REPLACE FUNCTION public.delete_student_by_reg(reg_no TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Find the user ID from the students table
  SELECT id INTO v_user_id FROM public.students WHERE registration_number = reg_no;

  IF v_user_id IS NOT NULL THEN
    -- 2. Delete any attendance records linked to this student
    DELETE FROM public.attendance WHERE registration_number = reg_no;
    DELETE FROM public.attendance_logs WHERE student_id = v_user_id;

    -- 3. Delete any notifications for this student
    DELETE FROM public.notifications WHERE student_id = v_user_id;

    -- 4. Delete from students table
    DELETE FROM public.students WHERE id = v_user_id;

    -- 5. Delete from auth.users (completely removes login)
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN TRUE;
  ELSE
    -- Fallback: check auth.users directly by metadata
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE raw_user_meta_data->>'reg_no' = reg_no 
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      DELETE FROM auth.users WHERE id = v_user_id;
      RETURN TRUE;
    END IF;

    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- Grant access so the dashboard can call it
GRANT EXECUTE ON FUNCTION public.delete_student_by_reg(TEXT) TO anon, authenticated;
