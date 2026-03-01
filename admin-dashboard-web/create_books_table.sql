-- Create books table
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    level TEXT NOT NULL,
    department TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create book_purchases table to track who bought which book
CREATE TABLE IF NOT EXISTS book_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    is_paid BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(book_id, student_id)
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_purchases ENABLE ROW LEVEL SECURITY;

-- Allow public access (or authenticated only, matching your current setup)
CREATE POLICY "Allow public read books" ON books FOR SELECT USING (true);
CREATE POLICY "Allow public insert books" ON books FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update books" ON books FOR UPDATE USING (true);
CREATE POLICY "Allow public delete books" ON books FOR DELETE USING (true);

CREATE POLICY "Allow public read purchases" ON book_purchases FOR SELECT USING (true);
CREATE POLICY "Allow public insert purchases" ON book_purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update purchases" ON book_purchases FOR UPDATE USING (true);
CREATE POLICY "Allow public delete purchases" ON book_purchases FOR DELETE USING (true);
