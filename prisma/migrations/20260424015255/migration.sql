-- DropIndex
DROP INDEX "PostReaction_postId_idx";

-- DropIndex
DROP INDEX "PostReaction_userId_idx";

-- AlterTable
ALTER TABLE "PostReaction" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "File" (
    "fileId" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("fileId")
);

-- CreateIndex
CREATE INDEX "File_postId_idx" ON "File"("postId");

-- CreateIndex
CREATE INDEX "PostReaction_postId_userId_idx" ON "PostReaction"("postId", "userId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("postId") ON DELETE RESTRICT ON UPDATE CASCADE;
