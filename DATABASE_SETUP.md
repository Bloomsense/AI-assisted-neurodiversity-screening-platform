# Database Setup Guide for Checklist Questions

## Overview
The application now fetches checklist questions from your Supabase database instead of using hardcoded values.

## Required Database Table

You need to create a table in your Supabase database to store the M-CHAT questions. The application will automatically try to find a table with one of these names:
- `questions`
- `mchat_questions`
- `checklist_questions`
- `m_chat_questions`

## Table Schema

Create a table with the following structure:

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Or if you prefer a different name:
CREATE TABLE mchat_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Alternative Column Names

The application also supports these alternative column names:
- `question_id` instead of `id`
- `question_text` or `text` instead of `question`
- `question_order` instead of `order`

## Row Level Security (RLS)

Make sure to set up Row Level Security policies in Supabase to allow:
- **SELECT**: For reading questions (public access or authenticated users)
- **INSERT**: For adding new questions (admin only recommended)
- **UPDATE**: For editing questions (admin only recommended)
- **DELETE**: For deleting questions (admin only recommended)

Example RLS policies:

```sql
-- Allow everyone to read questions
CREATE POLICY "Allow public read access to questions"
ON questions FOR SELECT
USING (true);

-- Allow authenticated users to insert (or restrict to admins)
CREATE POLICY "Allow authenticated users to insert questions"
ON questions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update questions"
ON questions FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete questions"
ON questions FOR DELETE
TO authenticated
USING (true);
```

## Inserting Sample Questions

After creating the table, you can insert sample M-CHAT questions:

```sql
INSERT INTO questions (question, "order") VALUES
('Does your child enjoy being swung, bounced on your knee, etc.?', 1),
('Does your child take an interest in other children?', 2),
('Does your child like climbing on things, such as up stairs?', 3),
('Does your child enjoy playing peek-a-boo/hide-and-seek?', 4),
('Does your child ever pretend, for example, to talk on the phone or take care of dolls?', 5),
('Does your child ever point with the index finger to ask for something?', 6),
('Does your child ever point with the index finger to indicate interest in something?', 7),
('Can your child play properly with small toys without just mouthing, fiddling, or dropping them?', 8);
```

## Verification

1. Go to your Supabase dashboard
2. Navigate to the Table Editor
3. Create the table as described above
4. Insert some sample questions
5. Refresh your application - the questions should now load from the database

## Troubleshooting

If questions are not loading:
1. Check the browser console for error messages
2. Verify the table name matches one of the supported names
3. Check that RLS policies allow SELECT operations
4. Verify your Supabase credentials in `src/utils/supabase/info.tsx`
5. Check that the table has at least one row of data

The application will fall back to default questions if it cannot connect to the database, but you'll see a warning message.
