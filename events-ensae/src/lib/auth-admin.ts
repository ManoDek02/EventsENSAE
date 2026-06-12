// src/lib/auth-admin.ts
// Helpers d'authentification admin centralisés
// Remplace les fonctions requireAdminApi() dupliquées dans chaque route

import { requireApiAuth } from "@/lib/auth-api";
import { forbidden } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { hasPermission, type Permission } from "@/lib/permissions";

/* ── Vérifie que l'utilisateur est admin (tout rôle admin) ──── */
export async function requireAdminApi() {
    const session = await requireApiAuth();
    if (session.user.role !== "ADMIN") throw forbidden();
    return session;
}

/* ── Vérifie une permission spécifique ──────────────────────── */
export async function requirePermissionApi(permission: Permission) {
    const session = await requireAdminApi();

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { permissions: true },
    });

    if (!user || !hasPermission(user.permissions, permission)) {
        throw forbidden(`Permission requise : ${permission}`);
    }

    return session;
}