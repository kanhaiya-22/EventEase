-- AlterTable
ALTER TABLE "events" ADD COLUMN "documents" JSONB NOT NULL DEFAULT '[]';
