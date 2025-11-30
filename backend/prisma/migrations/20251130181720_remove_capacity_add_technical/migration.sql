/*
  Warnings:

  - You are about to drop the column `capacity` on the `Event` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "location" TEXT,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "venueCapacity" INTEGER,
    "promotorName" TEXT,
    "promotorPhone" TEXT,
    "artistLiaisonName" TEXT,
    "artistLiaisonPhone" TEXT,
    "technicalName" TEXT,
    "technicalPhone" TEXT,
    "runningOrder" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Event" ("artistLiaisonName", "artistLiaisonPhone", "createdAt", "description", "endDate", "id", "location", "name", "promotorName", "promotorPhone", "runningOrder", "startDate", "status", "updatedAt", "venueAddress", "venueCapacity", "venueName") SELECT "artistLiaisonName", "artistLiaisonPhone", "createdAt", "description", "endDate", "id", "location", "name", "promotorName", "promotorPhone", "runningOrder", "startDate", "status", "updatedAt", "venueAddress", "venueCapacity", "venueName" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");
CREATE INDEX "Event_status_idx" ON "Event"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
