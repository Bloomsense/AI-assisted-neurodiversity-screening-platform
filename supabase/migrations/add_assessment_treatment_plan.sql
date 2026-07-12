-- Optional: dedicated column for therapist treatment plans on assessments.
-- Safe to run if the column does not already exist.
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS treatment_plan text;
