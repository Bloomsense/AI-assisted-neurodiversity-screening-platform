# Patients Table Setup Guide

## Overview
The application now saves child profiles to a `patients` table in your Supabase database.

## Required Database Table

You need to create a `patients` table in your Supabase database. Run the SQL script provided in `setup_patients_table.sql` or use the SQL below.

## Table Schema

```sql
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT,
  contact_info TEXT,
  caregiver_name TEXT NOT NULL,
  caregiver_phone TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS)

The setup script includes RLS policies that allow:
- **SELECT**: Public read access (so the app can fetch patients)
- **INSERT**: Authenticated users can create patients
- **UPDATE**: Authenticated users can update patients
- **DELETE**: Authenticated users can delete patients

## Indexes

The table includes indexes for:
- `child_name` - for faster name searches
- `created_at` - for sorting by creation date

## Setup Instructions

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `setup_patients_table.sql`
4. Run the SQL script
5. Verify the table was created in the Table Editor

## Verification

After creating the table:
1. Try creating a new child profile in the application
2. Check the Supabase Table Editor to see the new patient record
3. The patient ID will be used for navigation and future references

## Troubleshooting

If you encounter errors when saving:

1. **"relation 'patients' does not exist"**
   - The table hasn't been created yet. Run the SQL script.

2. **"permission denied for table patients"**
   - Check that RLS policies are set up correctly
   - Verify your Supabase credentials in `src/utils/supabase/info.tsx`

3. **"new row violates row-level security policy"**
   - Check that the INSERT policy allows the operation
   - Verify authentication if using authenticated policies

4. **Age validation errors**
   - The age must be a number between 0 and 18
   - Check that the age field contains a valid integer

## Table Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key, auto-generated |
| child_name | TEXT | Yes | Full name of the child |
| age | INTEGER | Yes | Age in years (0-18) |
| gender | TEXT | No | Gender (male/female/other) |
| contact_info | TEXT | No | Email or additional contact info |
| caregiver_name | TEXT | Yes | Primary caregiver's name |
| caregiver_phone | TEXT | No | Caregiver's phone number |
| remarks | TEXT | No | Initial notes/observations |
| created_at | TIMESTAMP | Auto | Record creation timestamp |
| updated_at | TIMESTAMP | Auto | Last update timestamp |
