-- Add method column to attendance table if it doesn't exist
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'Fingerprint';

-- Also add registration_number to attendance table if missing (for better matching)
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS registration_number TEXT;
