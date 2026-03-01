-- Add geographical location columns to courses table for Geofencing attendance

ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS latitude NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS longitude NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS radius_meters INTEGER DEFAULT 50;

-- Optional: Add a check constraint to ensure valid coordinates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'valid_coordinates' 
        AND conrelid = 'public.courses'::regclass
    ) THEN
        ALTER TABLE public.courses
        ADD CONSTRAINT valid_coordinates 
        CHECK (
            (latitude IS NULL AND longitude IS NULL) OR 
            (latitude >= -90 AND latitude <= 90 AND longitude >= -180 AND longitude <= 180)
        );
    END IF;
END $$;
