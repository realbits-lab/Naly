-- Add user_id column to generated_articles table
ALTER TABLE generated_articles
ADD COLUMN user_id UUID;

-- Make user_id NOT NULL with a default value for existing rows
-- First, let's set a default UUID for existing rows (you might want to adjust this)
UPDATE generated_articles
SET user_id = '773eb6d8-84de-4fc2-939c-6e3dbb4be20f'
WHERE user_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE generated_articles
ALTER COLUMN user_id SET NOT NULL;