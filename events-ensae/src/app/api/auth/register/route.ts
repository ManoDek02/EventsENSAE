import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, filiere, promotion } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs requis sont manquants." },
        { status: 400 }
      );
    }

    // Vérifie si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        filiere,
        promotion,
      },
    });

    // Crée un token de vérification (valide 24h)
    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: { token, userId: user.id, expires },
    });

    // Envoie l'email de vérification
    await sendVerificationEmail(email, name, token);

    return NextResponse.json(
      { message: "Compte créé. Vérifiez votre email pour activer votre compte." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
