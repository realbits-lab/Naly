-- Create the new user_role enum
CREATE TYPE "user_role" AS ENUM('reader', 'writer', 'manager');

-- Update the user table to use the new enum
-- First, add a temporary column with the new enum
ALTER TABLE "user" ADD COLUMN "role_new" "user_role" DEFAULT 'reader';

-- Update all existing users to reader role
UPDATE "user" SET "role_new" = 'reader'::user_role;

-- Drop the old role column
ALTER TABLE "user" DROP COLUMN "role";

-- Rename the new column to role
ALTER TABLE "user" RENAME COLUMN "role_new" TO "role";

-- Set the column as NOT NULL
ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;