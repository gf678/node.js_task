-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "image" TEXT;

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
