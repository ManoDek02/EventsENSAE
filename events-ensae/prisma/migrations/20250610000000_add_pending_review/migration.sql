-- prisma/migrations/20250610000000_add_pending_review/migration.sql
ALTER TYPE "TicketStatus"
ADD VALUE 'PENDING_REVIEW';