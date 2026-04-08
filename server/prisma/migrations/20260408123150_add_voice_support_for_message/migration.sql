-- Create enum
CREATE TYPE "public"."MessageType" AS ENUM ('text', 'voice', 'image');

-- Rename column
ALTER TABLE "public"."Message"
RENAME COLUMN "kind" TO "type";

-- Add new columns
ALTER TABLE "public"."Message"
ADD COLUMN "voiceDurationSec" INTEGER,
ADD COLUMN "voiceMimeType" TEXT,
ADD COLUMN "voiceUrl" TEXT;

-- Drop old default first
ALTER TABLE "public"."Message"
ALTER COLUMN "type" DROP DEFAULT;

-- Convert text/varchar column to enum
ALTER TABLE "public"."Message"
ALTER COLUMN "type"
TYPE "public"."MessageType"
USING "type"::"public"."MessageType";

-- Set new enum default
ALTER TABLE "public"."Message"
ALTER COLUMN "type"
SET DEFAULT 'text';

-- Add constraint
ALTER TABLE "public"."Message"
ADD CONSTRAINT message_payload_check
CHECK (
  (
    "type" = 'text'
    AND "text" IS NOT NULL
    AND length(trim("text")) > 0
    AND "voiceUrl" IS NULL
    AND "voiceMimeType" IS NULL
    AND "voiceDurationSec" IS NULL
  )
  OR
  (
    "type" = 'voice'
    AND "text" IS NULL
    AND "voiceUrl" IS NOT NULL
    AND "voiceMimeType" IS NOT NULL
    AND "voiceDurationSec" IS NOT NULL
  )
);