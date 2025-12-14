/*
  Migration: Add userId to Comment table for authorization
  
  Note: Existing comments without userId are deleted as they cannot be attributed to a user.
  This is a security improvement to ensure all comments have ownership.
*/
-- Delete existing comments that don't have userId (they will be recreated by users if needed)
DELETE FROM "Comment";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lineItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "LineItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE INDEX "Comment_lineItemId_idx" ON "Comment"("lineItemId");
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
