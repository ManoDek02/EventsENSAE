import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "ADMIN") {
    redirect("/");
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
      createdAt: true,
    },
  });
}
