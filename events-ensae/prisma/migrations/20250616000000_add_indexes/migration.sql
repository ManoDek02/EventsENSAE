-- prisma/migrations/20250616000000_add_indexes/migration.sql
-- Index sur Ticket (requêtes fréquentes par userId, eventId, status)
CREATE INDEX IF NOT EXISTS "Ticket_userId_idx" ON "Ticket"("userId");
CREATE INDEX IF NOT EXISTS "Ticket_eventId_idx" ON "Ticket"("eventId");
CREATE INDEX IF NOT EXISTS "Ticket_status_idx" ON "Ticket"("status");
-- Index composite pour getOccupiedSeats (eventId + status simultanément)
CREATE INDEX IF NOT EXISTS "Ticket_eventId_status_idx" ON "Ticket"("eventId", "status");
-- Index sur MusicSuggestion
CREATE INDEX IF NOT EXISTS "MusicSuggestion_eventId_idx" ON "MusicSuggestion"("eventId");
CREATE INDEX IF NOT EXISTS "MusicSuggestion_userId_idx" ON "MusicSuggestion"("userId");
-- Index sur EscortRequest
CREATE INDEX IF NOT EXISTS "EscortRequest_eventId_idx" ON "EscortRequest"("eventId");
CREATE INDEX IF NOT EXISTS "EscortRequest_requesterId_idx" ON "EscortRequest"("requesterId");
CREATE INDEX IF NOT EXISTS "EscortRequest_status_idx" ON "EscortRequest"("status");
-- Index sur EscortProposal
CREATE INDEX IF NOT EXISTS "EscortProposal_requestId_idx" ON "EscortProposal"("requestId");
CREATE INDEX IF NOT EXISTS "EscortProposal_proposerId_idx" ON "EscortProposal"("proposerId");
-- Index sur WaitlistEntry
CREATE INDEX IF NOT EXISTS "WaitlistEntry_eventId_idx" ON "WaitlistEntry"("eventId");