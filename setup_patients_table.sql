-- Create the patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT,
  contact_info TEXT,
  caregiver_name TEXT NOT NULL,
  caregiver_contact TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (so the app can fetch patients)
CREATE POLICY "Allow public read access to patients"
ON patients FOR SELECT
USING (true);

-- Create policy to allow authenticated users to insert patients
CREATE POLICY "Allow authenticated users to insert patients"
ON patients FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update patients
CREATE POLICY "Allow authenticated users to update patients"
ON patients FOR UPDATE
TO authenticated
USING (true);

-- Create policy to allow authenticated users to delete patients
CREATE POLICY "Allow authenticated users to delete patients"
ON patients FOR DELETE
TO authenticated
USING (true);

-- Create index on child_name for faster searches
CREATE INDEX IF NOT EXISTS idx_patients_child_name ON patients(child_name);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);
