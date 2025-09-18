-- Create the new user_role enum
CREATE TYPE "user_role" AS ENUM('reader', 'writer', 'manager');

-- Add a temporary column with the new enum
ALTER TABLE "users" ADD COLUMN "role_new" "user_role" DEFAULT 'reader';

-- Update existing data to map old roles to new roles
UPDATE "users" SET "role_new" =
  CASE
    WHEN "role" = 'ADMIN' THEN 'manager'::user_role
    WHEN "role" = 'INSTITUTIONAL_MANAGER' THEN 'manager'::user_role
    WHEN "role" = 'INSTITUTIONAL_ANALYST' THEN 'writer'::user_role
    WHEN "role" = 'RETAIL_PROFESSIONAL' THEN 'writer'::user_role
    WHEN "role" = 'RETAIL_INDIVIDUAL' THEN 'reader'::user_role
    ELSE 'reader'::user_role
  END;

-- Drop the old role column
ALTER TABLE "users" DROP COLUMN "role";

-- Rename the new column to role
ALTER TABLE "users" RENAME COLUMN "role_new" TO "role";

-- Set the column as NOT NULL
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;