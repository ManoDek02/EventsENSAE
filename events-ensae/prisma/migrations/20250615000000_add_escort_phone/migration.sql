-- prisma/migrations/20250615000000_add_escort_phone/migration.sql

ALTER TABLE "EscortRequest"  ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "EscortProposal" ADD COLUMN "phoneNumber" TEXT;