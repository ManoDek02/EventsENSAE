-- prisma/migrations/20250612000000_add_escort_requests/migration.sql
CREATE TYPE "EscortRequestStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED');
CREATE TYPE "EscortProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "GenderPreference" AS ENUM ('HOMME', 'FEMME', 'INDIFFERENT');
CREATE TABLE "EscortRequest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "photoUrl" TEXT,
    "genderPreference" "GenderPreference" NOT NULL DEFAULT 'INDIFFERENT',
    "status" "EscortRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EscortRequest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EscortProposal" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "EscortProposalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EscortProposal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EscortProposal_requestId_proposerId_key" UNIQUE ("requestId", "proposerId")
);
ALTER TABLE "EscortRequest"
ADD CONSTRAINT "EscortRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EscortRequest"
ADD CONSTRAINT "EscortRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EscortProposal"
ADD CONSTRAINT "EscortProposal_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "EscortRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EscortProposal"
ADD CONSTRAINT "EscortProposal_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;