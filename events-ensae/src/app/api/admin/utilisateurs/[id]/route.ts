// src/app/api/admin/utilisateurs/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, forbidden, notFound, badRequest } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS, type Permission } from "@/lib/permissions";

type RouteParams = { params: Promise<{ id: string }> };

async function requireManageUsers() {
  const session = await requireApiAuth();
  if (session.user.role !== "ADMIN") throw forbidden();

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });

  if (!currentUser || !hasPermission(currentUser.permissions, "MANAGE_USERS")) {
    throw forbidden("Vous n'avez pas la permission de gérer les utilisateurs.");
  }

  return session;
}

/* PATCH /api/admin/utilisateurs/[id] */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const adminSession = await requireManageUsers();
    const { id } = await params;

    if (id === adminSession.user.id) {
      throw badRequest("Vous ne pouvez pas modifier votre propre compte ici.");
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw notFound("Utilisateur introuvable.");

    const body = await req.json();
    const { role, disabled, permissions } = body as {
      role?: "STUDENT" | "ADMIN";
      disabled?: boolean;
      permissions?: string[];
    };

    /* Valider le rôle */
    if (role !== undefined && !["STUDENT", "ADMIN"].includes(role)) {
      throw badRequest("Rôle invalide.");
    }

    /* Valider les permissions */
    const VALID_PERMISSIONS = Object.values(PERMISSIONS);
    if (permissions !== undefined) {
      const invalidPerms = permissions.filter((p) => !VALID_PERMISSIONS.includes(p as Permission));
      if (invalidPerms.length > 0) {
        throw badRequest(`Permissions invalides : ${invalidPerms.join(", ")}`);
      }
      // Si on assigne des permissions, le rôle doit être ADMIN
      if (permissions.length > 0 && user.role === "STUDENT" && role !== "ADMIN") {
        throw badRequest("Un étudiant ne peut pas avoir de permissions admin. Passez-le d'abord en ADMIN.");
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(permissions !== undefined ? { permissions } : {}),
        ...(disabled === true ? { emailVerified: null } : {}),
        ...(disabled === false ? { emailVerified: new Date() } : {}),
        // Si on repasse en STUDENT, vider les permissions
        ...(role === "STUDENT" ? { permissions: [] } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({ user: updated, message: "Utilisateur mis à jour." });
  } catch (error) {
    return errorResponse(error);
  }
}