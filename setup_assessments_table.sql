-- Create the assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  mchat_answers JSONB NOT NULL,
  mchat_questions JSONB NOT NULL,
  behavior_notes TEXT,
  total_questions INTEGER NOT NULL,
  pass_count INTEGER NOT NULL,
  fail_count INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  screen_positive BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (so the app can fetch assessments)
CREATE POLICY "Allow public read access to assessments"
ON assessments FOR SELECT
USING (true);

-- Create policy to allow authenticated users to insert assessments
CREATE POLICY "Allow authenticated users to insert assessments"
ON assessments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update assessments
CREATE POLICY "Allow authenticated users to update assessments"
ON assessments FOR UPDATE
TO authenticated
USING (true);

-- Create policy to allow authenticated users to delete assessments
CREATE POLICY "Allow authenticated users to delete assessments"
ON assessments FOR DELETE
TO authenticated
USING (true);

-- Create index on patient_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_assessments_patient_id ON assessments(patient_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);

-- Create index on screen_positive for filtering
CREATE INDEX IF NOT EXISTS idx_assessments_screen_positive ON assessments(screen_positive);
