/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `EscortProposal` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `EscortRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EscortProposal" DROP COLUMN "phoneNumber";

-- AlterTable
ALTER TABLE "EscortRequest" DROP COLUMN "phoneNumber";
