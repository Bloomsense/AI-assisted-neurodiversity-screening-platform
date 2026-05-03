-- Migration script to add caregiver_phone column to patients table
-- Run this if you get an error about missing 'caregiver_phone' column

-- Add the caregiver_phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'caregiver_phone'
    ) THEN
        ALTER TABLE patients ADD COLUMN caregiver_phone TEXT;
        RAISE NOTICE 'Column caregiver_phone added successfully';
    ELSE
        RAISE NOTICE 'Column caregiver_phone already exists';
    END IF;
END $$;
