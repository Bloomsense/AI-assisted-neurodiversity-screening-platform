# Assessments Table Setup Guide

## Overview
The application now saves screening results to an `assessments` table in your Supabase database. Each completed screening creates a new assessment record linked to a patient.

## Required Database Table

You need to create an `assessments` table in your Supabase database. Run the SQL script provided in `setup_assessments_table.sql` or use the SQL below.

## Table Schema

```sql
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
```

## Table Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key, auto-generated |
| patient_id | UUID | Yes | Foreign key to patients table |
| mchat_answers | JSONB | Yes | All M-CHAT answers (Yes/No) as JSON object |
| mchat_questions | JSONB | Yes | All M-CHAT questions as JSON array |
| behavior_notes | TEXT | No | Behavior observations from Stage 2 |
| total_questions | INTEGER | Yes | Total number of questions answered |
| pass_count | INTEGER | Yes | Number of questions that passed |
| fail_count | INTEGER | Yes | Number of questions that failed |
| risk_level | TEXT | Yes | "High Risk" or "Low Risk" |
| screen_positive | BOOLEAN | Yes | true if 2+ items failed, false otherwise |
| created_at | TIMESTAMP | Auto | Record creation timestamp |
| updated_at | TIMESTAMP | Auto | Last update timestamp |

## Row Level Security (RLS)

The setup script includes RLS policies that allow:
- **SELECT**: Public read access (so the app can fetch assessments)
- **INSERT**: Authenticated users can create assessments
- **UPDATE**: Authenticated users can update assessments
- **DELETE**: Authenticated users can delete assessments

## Indexes

The table includes indexes for:
- `patient_id` - for faster lookups by patient
- `created_at` - for sorting by assessment date
- `screen_positive` - for filtering by risk level

## Foreign Key Relationship

The `assessments` table has a foreign key relationship with the `patients` table:
- `patient_id` references `patients(id)`
- Uses `ON DELETE CASCADE` - if a patient is deleted, all their assessments are also deleted

## Setup Instructions

1. **First, ensure the patients table exists** (see `PATIENTS_TABLE_SETUP.md`)
2. Go to your Supabase dashboard
3. Navigate to the SQL Editor
4. Copy and paste the contents of `setup_assessments_table.sql`
5. Run the SQL script
6. Verify the table was created in the Table Editor

## How It Works

1. When a screening is completed, the user is navigated to the results screen
2. The `ScreeningResults` component automatically saves the assessment to the database
3. The assessment includes:
   - All M-CHAT answers and questions (stored as JSON)
   - Behavior observations
   - Calculated scores (pass/fail counts)
   - Risk level determination
   - Screen positive status

## Verification

After creating the table:
1. Complete a screening in the application
2. Check the Supabase Table Editor to see the new assessment record
3. Verify that:
   - The `patient_id` matches the patient who was screened
   - The `mchat_answers` and `mchat_questions` contain JSON data
   - The calculated fields (`pass_count`, `fail_count`, `risk_level`, `screen_positive`) are correct

## Querying Assessments

### Get all assessments for a patient:
```sql
SELECT * FROM assessments 
WHERE patient_id = 'patient-uuid-here'
ORDER BY created_at DESC;
```

### Get all high-risk assessments:
```sql
SELECT * FROM assessments 
WHERE screen_positive = true
ORDER BY created_at DESC;
```

### Get assessment with patient details:
```sql
SELECT 
  a.*,
  p.child_name,
  p.age
FROM assessments a
JOIN patients p ON a.patient_id = p.id
ORDER BY a.created_at DESC;
```

## Troubleshooting

If you encounter errors when saving:

1. **"relation 'assessments' does not exist"**
   - The table hasn't been created yet. Run the SQL script.

2. **"foreign key constraint fails"**
   - The `patients` table doesn't exist or the `patient_id` doesn't match any patient
   - Ensure the patients table is created first (see `PATIENTS_TABLE_SETUP.md`)

3. **"permission denied for table assessments"**
   - Check that RLS policies are set up correctly
   - Verify your Supabase credentials in `src/utils/supabase/info.tsx`

4. **"new row violates row-level security policy"**
   - Check that the INSERT policy allows the operation
   - Verify authentication if using authenticated policies

5. **JSONB errors**
   - Ensure `mchat_answers` and `mchat_questions` are valid JSON objects/arrays
   - The component automatically formats the data correctly

## Data Structure Examples

### mchat_answers (JSONB):
```json
{
  "1": "yes",
  "2": "no",
  "3": "yes",
  ...
}
```

### mchat_questions (JSONB):
```json
[
  {
    "id": "1",
    "question": "Does your child enjoy being swung...?",
    "order": 1
  },
  {
    "id": "2",
    "question": "Does your child take an interest...?",
    "order": 2
  },
  ...
]
```
