ALTER TABLE "Reaction"
ALTER COLUMN "type" TYPE VARCHAR(64)
USING "type"::text;

DROP TYPE "ReactionType";