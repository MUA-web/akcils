-- Function to delete a student completely, including their authentication profile
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.delete_student_by_reg(reg_no TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Find the user ID from the students table
  SELECT id INTO v_user_id FROM public.students WHERE registration_number = reg_no;
  
  IF v_user_id IS NOT NULL THEN
    -- 2. Delete from students table first to avoid FK constraint violations
    DELETE FROM public.students WHERE id = v_user_id;
    
    -- 3. Delete from face verification table if it exists and references them
    -- Note: If you don't have a faces table, this will safely not do anything 
    -- if wrapped in exception handling, but we assume faces might exist by reg_no.
    -- (uncomment if you need to delete faces too)
    -- DELETE FROM public.faces WHERE registration_number = reg_no;
    
    -- 4. Delete from auth.users (This completely removes their login capability)
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RETURN TRUE;
  ELSE
    -- If they aren't in students table, check if they exist in auth anyway 
    -- by searching user_metadata (fallback)
    SELECT id INTO v_user_id FROM auth.users WHERE raw_user_meta_data->>'reg_no' = reg_no LIMIT 1;
    IF v_user_id IS NOT NULL THEN
       DELETE FROM auth.users WHERE id = v_user_id;
       RETURN TRUE;
    END IF;
    
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to anon and authenticated users so the dashboard can call it
GRANT EXECUTE ON FUNCTION public.delete_student_by_reg(TEXT) TO anon, authenticated;
