-- CreateEnum
CREATE TYPE "OrganizerRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ORGANIZER_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'ORGANIZER_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'ORGANIZER_REJECTED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "organizer_requests" (
    "id" TEXT NOT NULL,
    "status" "OrganizerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "collegeName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "organizationWeb" TEXT,
    "reason" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "organizer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizer_requests_userId_key" ON "organizer_requests"("userId");

-- CreateIndex
CREATE INDEX "organizer_requests_status_idx" ON "organizer_requests"("status");

-- AddForeignKey
ALTER TABLE "organizer_requests" ADD CONSTRAINT "organizer_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_requests" ADD CONSTRAINT "organizer_requests_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
