-- prisma/migrations/20250613000000_add_user_permissions/migration.sql

-- Ajouter le champ permissions (tableau de strings) sur User
ALTER TABLE "User" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT '{}';

-- Donner SUPER_ADMIN à tous les admins existants
UPDATE "User" SET "permissions" = ARRAY['SUPER_ADMIN'] WHERE "role" = 'ADMIN';