-- prisma/migrations/20250611000000_add_ticket_types/migration.sql
-- CreateTable TicketType
CREATE TABLE "TicketType" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);
-- AddColumn ticketTypeId sur Ticket (nullable pour compatibilité)
ALTER TABLE "Ticket"
ADD COLUMN "ticketTypeId" TEXT;
-- AddForeignKey TicketType → Event
ALTER TABLE "TicketType"
ADD CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey Ticket → TicketType
ALTER TABLE "Ticket"
ADD CONSTRAINT "Ticket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE
SET NULL ON UPDATE CASCADE;