import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requis." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Réponse identique que l'utilisateur existe ou non (sécurité)
    const genericMessage =
      "Si un compte non vérifié existe avec cet email, un nouveau lien a été envoyé.";

    if (!user || user.emailVerified) {
      return NextResponse.json({ message: genericMessage });
    }

    await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: { token, userId: user.id, expires },
    });

    await sendVerificationEmail(user.email, user.name, token);

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("[RESEND_VERIFICATION]", error);
    return NextResponse.json(
      { error: "Impossible d'envoyer l'email. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
