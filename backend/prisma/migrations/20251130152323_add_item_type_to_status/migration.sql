-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "eventId" TEXT NOT NULL,
    CONSTRAINT "Status_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Status" ("color", "createdAt", "eventId", "id", "isDefault", "moduleType", "name", "order", "updatedAt") SELECT "color", "createdAt", "eventId", "id", "isDefault", "moduleType", "name", "order", "updatedAt" FROM "Status";
DROP TABLE "Status";
ALTER TABLE "new_Status" RENAME TO "Status";
CREATE INDEX "Status_eventId_moduleType_itemType_idx" ON "Status"("eventId", "moduleType", "itemType");
CREATE UNIQUE INDEX "Status_eventId_moduleType_itemType_name_key" ON "Status"("eventId", "moduleType", "itemType", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
