-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "eventId" TEXT,
    CONSTRAINT "Category_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("color", "createdAt", "description", "eventId", "id", "moduleType", "name", "updatedAt") SELECT "color", "createdAt", "description", "eventId", "id", "moduleType", "name", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE INDEX "Category_moduleType_idx" ON "Category"("moduleType");
CREATE INDEX "Category_eventId_idx" ON "Category"("eventId");
CREATE UNIQUE INDEX "Category_moduleType_name_key" ON "Category"("moduleType", "name");
CREATE TABLE "new_Status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "itemType" TEXT NOT NULL DEFAULT 'main',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "eventId" TEXT,
    CONSTRAINT "Status_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Status" ("color", "createdAt", "eventId", "id", "isDefault", "itemType", "moduleType", "name", "order", "updatedAt") SELECT "color", "createdAt", "eventId", "id", "isDefault", "itemType", "moduleType", "name", "order", "updatedAt" FROM "Status";
DROP TABLE "Status";
ALTER TABLE "new_Status" RENAME TO "Status";
CREATE INDEX "Status_moduleType_itemType_idx" ON "Status"("moduleType", "itemType");
CREATE INDEX "Status_eventId_idx" ON "Status"("eventId");
CREATE UNIQUE INDEX "Status_moduleType_itemType_name_key" ON "Status"("moduleType", "itemType", "name");
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "eventId" TEXT,
    CONSTRAINT "Tag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tag" ("color", "createdAt", "eventId", "id", "moduleType", "name", "updatedAt") SELECT "color", "createdAt", "eventId", "id", "moduleType", "name", "updatedAt" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE INDEX "Tag_moduleType_idx" ON "Tag"("moduleType");
CREATE INDEX "Tag_eventId_idx" ON "Tag"("eventId");
CREATE UNIQUE INDEX "Tag_moduleType_name_key" ON "Tag"("moduleType", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
