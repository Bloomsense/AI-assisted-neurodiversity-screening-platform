-- Query to check the gender_type enum values in your database
-- Run this in Supabase SQL Editor to see what values are allowed

SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'gender_type'
ORDER BY e.enumsortorder;
