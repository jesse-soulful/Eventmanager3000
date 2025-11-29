-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" REAL,
    "unitPrice" REAL,
    "totalPrice" REAL,
    "plannedCost" REAL,
    "actualCost" REAL,
    "metadata" TEXT,
    "parentLineItemId" TEXT,
    "statusId" TEXT,
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LineItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineItem_parentLineItemId_fkey" FOREIGN KEY ("parentLineItemId") REFERENCES "LineItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineItem_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LineItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LineItem" ("actualCost", "categoryId", "createdAt", "description", "eventId", "id", "metadata", "moduleType", "name", "parentLineItemId", "plannedCost", "quantity", "statusId", "totalPrice", "unitPrice", "updatedAt") SELECT "actualCost", "categoryId", "createdAt", "description", "eventId", "id", "metadata", "moduleType", "name", "parentLineItemId", "plannedCost", "quantity", "statusId", "totalPrice", "unitPrice", "updatedAt" FROM "LineItem";
DROP TABLE "LineItem";
ALTER TABLE "new_LineItem" RENAME TO "LineItem";
CREATE INDEX "LineItem_eventId_idx" ON "LineItem"("eventId");
CREATE INDEX "LineItem_moduleType_idx" ON "LineItem"("moduleType");
CREATE INDEX "LineItem_statusId_idx" ON "LineItem"("statusId");
CREATE INDEX "LineItem_categoryId_idx" ON "LineItem"("categoryId");
CREATE INDEX "LineItem_parentLineItemId_idx" ON "LineItem"("parentLineItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
