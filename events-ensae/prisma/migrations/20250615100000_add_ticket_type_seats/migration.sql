-- prisma/migrations/20250615100000_add_ticket_type_seats/migration.sql
ALTER TABLE "TicketType"
ADD COLUMN "seats" INTEGER NOT NULL DEFAULT 1;