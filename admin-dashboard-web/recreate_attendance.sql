-- Create the attendance table (legacy mapping)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    course_code TEXT NOT NULL,
    registration_number TEXT,
    department TEXT,
    level TEXT,
    method TEXT DEFAULT 'Passcode',
    status TEXT DEFAULT 'Present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: The admin dashboard expects 'status' to be populated, defaulting it to 'Present'.

-- Create the modern attendance_logs table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id),
    course_id UUID REFERENCES public.courses(id),
    status TEXT DEFAULT 'Present',
    marked_by TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
