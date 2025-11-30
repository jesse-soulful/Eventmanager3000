-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SubLineItemType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleType" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubLineItemType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubLineItemType" ("createdAt", "description", "eventId", "id", "isDefault", "moduleType", "name", "order", "updatedAt") SELECT "createdAt", "description", "eventId", "id", "isDefault", "moduleType", "name", "order", "updatedAt" FROM "SubLineItemType";
DROP TABLE "SubLineItemType";
ALTER TABLE "new_SubLineItemType" RENAME TO "SubLineItemType";
CREATE INDEX "SubLineItemType_moduleType_idx" ON "SubLineItemType"("moduleType");
CREATE INDEX "SubLineItemType_eventId_idx" ON "SubLineItemType"("eventId");
CREATE UNIQUE INDEX "SubLineItemType_moduleType_name_key" ON "SubLineItemType"("moduleType", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
