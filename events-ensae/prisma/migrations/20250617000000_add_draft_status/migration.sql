-- prisma/migrations/20250617000000_add_draft_status/migration.sql
DO $$ BEGIN ALTER TYPE "TicketStatus"
ADD VALUE 'DRAFT';
EXCEPTION
WHEN duplicate_object THEN null;
END $$;