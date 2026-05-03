-- Complete fix for patients table
-- This script will add any missing columns to the existing patients table

-- Add caregiver_phone if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'caregiver_phone'
    ) THEN
        ALTER TABLE patients ADD COLUMN caregiver_phone TEXT;
    END IF;
END $$;

-- Add contact_info if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'contact_info'
    ) THEN
        ALTER TABLE patients ADD COLUMN contact_info TEXT;
    END IF;
END $$;

-- Add remarks if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'remarks'
    ) THEN
        ALTER TABLE patients ADD COLUMN remarks TEXT;
    END IF;
END $$;

-- Add created_at if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE patients ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add updated_at if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE patients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;
