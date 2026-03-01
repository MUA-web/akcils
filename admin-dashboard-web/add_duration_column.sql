-- Add duration column to attendance table if missing
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '1 Hour';
