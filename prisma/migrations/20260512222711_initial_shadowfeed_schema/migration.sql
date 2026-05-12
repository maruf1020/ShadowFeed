-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('CONFESSION', 'UNPOPULAR_OPINION', 'FUNNY_MOMENT', 'WORK_STRUGGLE', 'SECRET_WIN', 'RANDOM_THOUGHT', 'SUGGESTION', 'MEME', 'POLL');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LAUGH', 'SKULL', 'FIRE', 'COFFEE', 'MELTING', 'BRAIN', 'SAME_BRO', 'LEGEND');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('ACTIVE', 'FLAGGED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'QUIZ_PASSED', 'QUIZ_FAILED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'PROFILE_UPDATED', 'POST_CREATED', 'POST_UPDATED', 'POST_DELETED', 'COMMENT_CREATED', 'COMMENT_DELETED', 'POLL_CREATED', 'POLL_VOTED', 'REACTION_TOGGLED', 'REPORT_CREATED', 'RECOVERY_SETUP_UPDATED', 'PASSWORD_RESET_COMPLETED', 'USER_SUSPENDED', 'USER_BANNED', 'ADMIN_NOTE_ADDED');

-- CreateEnum
CREATE TYPE "SuspensionType" AS ENUM ('SUSPENDED', 'BANNED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "employeeReference" VARCHAR(120),
    "quizPassedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" VARCHAR(40) NOT NULL,
    "fakeEmail" VARCHAR(120) NOT NULL,
    "avatarUrl" VARCHAR(500),
    "bio" VARCHAR(200),
    "hintOne" VARCHAR(20),
    "hintTwo" VARCHAR(20),
    "hintThree" VARCHAR(20),
    "moodStatus" VARCHAR(32),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryQuestionSetup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryQuestionSetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryAnswer" (
    "id" TEXT NOT NULL,
    "setupId" TEXT NOT NULL,
    "questionKey" VARCHAR(80) NOT NULL,
    "questionText" VARCHAR(160) NOT NULL,
    "answerHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "prompt" VARCHAR(200) NOT NULL,
    "explanation" VARCHAR(200),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionKey" VARCHAR(120),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(255),
    "passed" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" "PostCategory" NOT NULL,
    "title" VARCHAR(120),
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" VARCHAR(240),
    "gifUrl" VARCHAR(500),
    "imageUrl" VARCHAR(500),
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "status" "ModerationStatus" NOT NULL DEFAULT 'ACTIVE',
    "heatLevel" INTEGER NOT NULL DEFAULT 0,
    "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "pollVoteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(48) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "gifUrl" VARCHAR(500),
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "status" "ModerationStatus" NOT NULL DEFAULT 'ACTIVE',
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "question" VARCHAR(220) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPrompt" (
    "id" TEXT NOT NULL,
    "prompt" VARCHAR(180) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "reason" VARCHAR(120) NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(80),
    "details" JSONB,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suspension" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SuspensionType" NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suspension_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProfile_userId_key" ON "PublicProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProfile_username_key" ON "PublicProfile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProfile_fakeEmail_key" ON "PublicProfile"("fakeEmail");

-- CreateIndex
CREATE INDEX "PublicProfile_username_idx" ON "PublicProfile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryQuestionSetup_userId_key" ON "RecoveryQuestionSetup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryAnswer_setupId_questionKey_key" ON "RecoveryAnswer"("setupId", "questionKey");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_slug_key" ON "QuizQuestion"("slug");

-- CreateIndex
CREATE INDEX "QuizQuestion_isActive_displayOrder_idx" ON "QuizQuestion"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "QuizOption_questionId_displayOrder_idx" ON "QuizOption"("questionId", "displayOrder");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_createdAt_idx" ON "QuizAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QuizAttemptAnswer_questionId_idx" ON "QuizAttemptAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_category_createdAt_idx" ON "Post"("category", "createdAt");

-- CreateIndex
CREATE INDEX "Post_status_createdAt_idx" ON "Post"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "PostTag_tagId_postId_idx" ON "PostTag"("tagId", "postId");

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Reaction_postId_createdAt_idx" ON "Reaction"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Reaction_commentId_createdAt_idx" ON "Reaction"("commentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_type_postId_key" ON "Reaction"("userId", "type", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_type_commentId_key" ON "Reaction"("userId", "type", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Poll_postId_key" ON "Poll"("postId");

-- CreateIndex
CREATE INDEX "PollOption_pollId_displayOrder_idx" ON "PollOption"("pollId", "displayOrder");

-- CreateIndex
CREATE INDEX "PollVote_optionId_idx" ON "PollVote"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_pollId_userId_key" ON "PollVote"("pollId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPrompt_prompt_key" ON "DailyPrompt"("prompt");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Suspension_userId_isActive_idx" ON "Suspension"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "PublicProfile" ADD CONSTRAINT "PublicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryQuestionSetup" ADD CONSTRAINT "RecoveryQuestionSetup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryAnswer" ADD CONSTRAINT "RecoveryAnswer_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "RecoveryQuestionSetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptAnswer" ADD CONSTRAINT "QuizAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptAnswer" ADD CONSTRAINT "QuizAttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptAnswer" ADD CONSTRAINT "QuizAttemptAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "QuizOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suspension" ADD CONSTRAINT "Suspension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
