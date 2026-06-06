import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/error?error=missing-token", req.url)
    );
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    return NextResponse.redirect(
      new URL("/auth/error?error=invalid-token", req.url)
    );
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(
      new URL("/auth/error?error=expired-token", req.url)
    );
  }

  // Marque l'email comme vérifié
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: new Date() },
  });

  // Supprime le token utilisé
  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.redirect(
    new URL("/auth/login?verified=true", req.url)
  );
}
