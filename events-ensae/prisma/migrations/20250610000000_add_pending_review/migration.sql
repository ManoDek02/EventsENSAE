-- Ajout de PENDING_REVIEW à l'enum TicketStatus
-- Utilise IF NOT EXISTS pour éviter l'erreur si la valeur existe déjà
DO $$ BEGIN ALTER TYPE "TicketStatus"
ADD VALUE 'PENDING_REVIEW';
EXCEPTION
WHEN duplicate_object THEN null;
END $$;