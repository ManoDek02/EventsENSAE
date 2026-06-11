// src/lib/session.ts
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, type Permission } from "@/lib/permissions";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  return session;
}

/* ─── Require Admin (SUPER_ADMIN ou toute permission admin) ──── */
export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "ADMIN") redirect("/");

  return session;
}

/* ─── Require Permission spécifique ────────────────────────── */
export async function requirePermission(permission: Permission) {
  const session = await requireAuth();

  if (session.user.role !== "ADMIN") redirect("/");

  // Récupérer les permissions depuis la base
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });

  if (!user || !hasPermission(user.permissions, permission)) {
    redirect("/admin?error=forbidden");
  }

  return session;
}

export async function getCurrentUser() {
  const session = await requireAuth();

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      filiere: true,
      promotion: true,
      emailVerified: true,
      role: true,
      permissions: true,
      createdAt: true,
    },
  });
}