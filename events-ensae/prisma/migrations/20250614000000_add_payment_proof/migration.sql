-- prisma/migrations/20250614000000_add_payment_proof/migration.sql

-- Email admin spécifique par événement
ALTER TABLE "Event" ADD COLUMN "adminEmail" TEXT;

-- URL de la preuve de paiement uploadée par l'étudiant
ALTER TABLE "Ticket" ADD COLUMN "paymentProofUrl" TEXT;