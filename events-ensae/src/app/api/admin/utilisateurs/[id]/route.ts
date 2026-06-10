// src/app/api/admin/utilisateurs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, forbidden, notFound, badRequest } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

async function requireAdminApi() {
    const session = await requireApiAuth();
    if (session.user.role !== "ADMIN") throw forbidden();
    return session;
}

/* PATCH /api/admin/utilisateurs/[id] — changer rôle ou désactiver */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const adminSession = await requireAdminApi();
        const { id } = await params;

        if (id === adminSession.user.id) {
            throw badRequest("Vous ne pouvez pas modifier votre propre compte ici.");
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw notFound("Utilisateur introuvable.");

        const body = await req.json();
        const { role, disabled } = body as { role?: "STUDENT" | "ADMIN"; disabled?: boolean };

        const VALID_ROLES = ["STUDENT", "ADMIN"];
        if (role !== undefined && !VALID_ROLES.includes(role)) {
            throw badRequest("Rôle invalide. Valeurs acceptées : STUDENT, ADMIN.");
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(role !== undefined ? { role } : {}),
                /* Désactiver = retirer emailVerified pour bloquer la connexion */
                ...(disabled === true ? { emailVerified: null } : {}),
                ...(disabled === false ? { emailVerified: new Date() } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                emailVerified: true,
            },
        });

        return NextResponse.json({ user: updated, message: "Utilisateur mis à jour." });
    } catch (error) {
        return errorResponse(error);
    }
}