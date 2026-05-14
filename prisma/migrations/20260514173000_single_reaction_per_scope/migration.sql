WITH ranked_post_reactions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "postId"
      ORDER BY "createdAt" DESC, id DESC
    ) AS row_number
  FROM "Reaction"
  WHERE "postId" IS NOT NULL
),
ranked_comment_reactions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "commentId"
      ORDER BY "createdAt" DESC, id DESC
    ) AS row_number
  FROM "Reaction"
  WHERE "commentId" IS NOT NULL
)
DELETE FROM "Reaction"
WHERE id IN (
  SELECT id FROM ranked_post_reactions WHERE row_number > 1
  UNION
  SELECT id FROM ranked_comment_reactions WHERE row_number > 1
);

DROP INDEX IF EXISTS "Reaction_userId_type_postId_key";
DROP INDEX IF EXISTS "Reaction_userId_type_commentId_key";

CREATE UNIQUE INDEX "Reaction_userId_postId_key" ON "Reaction"("userId", "postId");
CREATE UNIQUE INDEX "Reaction_userId_commentId_key" ON "Reaction"("userId", "commentId");