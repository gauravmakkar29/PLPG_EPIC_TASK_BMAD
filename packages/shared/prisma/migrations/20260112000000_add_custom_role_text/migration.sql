-- Add custom_role_text column to onboarding_responses table
-- This field stores the custom role description when users select "Other" as their current role
-- AIRE-234: Story 2.2 - Step 1 Current Role Selection

ALTER TABLE "onboarding_responses"
ADD COLUMN IF NOT EXISTS "custom_role_text" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "onboarding_responses"."custom_role_text" IS 'Custom role description when user selects Other as current role';
