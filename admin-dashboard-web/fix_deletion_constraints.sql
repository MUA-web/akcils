-- Fix foreign key constraints to allow deleting departments/levels
-- This script replaces existing constraints with "ON DELETE CASCADE" versions

-- 1. Fix constraints in public.levels (referencing departments)
ALTER TABLE public.levels DROP CONSTRAINT IF EXISTS levels_department_id_fkey;
ALTER TABLE public.levels 
ADD CONSTRAINT levels_department_id_fkey 
FOREIGN KEY (department_id) 
REFERENCES public.departments(id) 
ON DELETE CASCADE;

-- 2. Fix constraints in public.students (referencing departments and levels)
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_department_id_fkey;
ALTER TABLE public.students 
ADD CONSTRAINT students_department_id_fkey 
FOREIGN KEY (department_id) 
REFERENCES public.departments(id) 
ON DELETE SET NULL;

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_level_id_fkey;
ALTER TABLE public.students 
ADD CONSTRAINT students_level_id_fkey 
FOREIGN KEY (level_id) 
REFERENCES public.levels(id) 
ON DELETE SET NULL;

-- 3. Fix constraints in public.courses (referencing departments and levels)
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_department_id_fkey;
ALTER TABLE public.courses 
ADD CONSTRAINT courses_department_id_fkey 
FOREIGN KEY (department_id) 
REFERENCES public.departments(id) 
ON DELETE CASCADE;

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_level_id_fkey;
ALTER TABLE public.courses 
ADD CONSTRAINT courses_level_id_fkey 
FOREIGN KEY (level_id) 
REFERENCES public.levels(id) 
ON DELETE CASCADE;

-- 4. Fix constraints in public.attendance_logs (referencing courses)
ALTER TABLE public.attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_course_id_fkey;
ALTER TABLE public.attendance_logs 
ADD CONSTRAINT attendance_logs_course_id_fkey 
FOREIGN KEY (course_id) 
REFERENCES public.courses(id) 
ON DELETE CASCADE;
