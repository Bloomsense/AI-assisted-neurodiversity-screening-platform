-- Create the questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (so the app can fetch questions)
CREATE POLICY "Allow public read access to questions"
ON questions FOR SELECT
USING (true);

-- Create policy to allow authenticated users to insert questions
CREATE POLICY "Allow authenticated users to insert questions"
ON questions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update questions
CREATE POLICY "Allow authenticated users to update questions"
ON questions FOR UPDATE
TO authenticated
USING (true);

-- Create policy to allow authenticated users to delete questions
CREATE POLICY "Allow authenticated users to delete questions"
ON questions FOR DELETE
TO authenticated
USING (true);

-- Insert sample M-CHAT questions
INSERT INTO questions (question, "order") VALUES
('Does your child enjoy being swung, bounced on your knee, etc.?', 1),
('Does your child take an interest in other children?', 2),
('Does your child like climbing on things, such as up stairs?', 3),
('Does your child enjoy playing peek-a-boo/hide-and-seek?', 4),
('Does your child ever pretend, for example, to talk on the phone or take care of dolls?', 5),
('Does your child ever point with the index finger to ask for something?', 6),
('Does your child ever point with the index finger to indicate interest in something?', 7),
('Can your child play properly with small toys without just mouthing, fiddling, or dropping them?', 8)
ON CONFLICT DO NOTHING;
