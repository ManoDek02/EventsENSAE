// src/app/api/escort/route.ts — mise à jour avec phoneNumber

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, badRequest } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

/* GET /api/escort?eventId= */
export async function GET(req: NextRequest) {
  try {
    await requireApiAuth();
    const eventId = req.nextUrl.searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId requis." }, { status: 400 });

    const requests = await prisma.escortRequest.findMany({
      where: { eventId, status: "OPEN" },
      include: {
        requester: {
          select: { id: true, name: true, filiere: true, promotion: true, image: true },
        },
        _count: { select: { proposals: { where: { status: "PENDING" } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Ne pas exposer le numéro de téléphone publiquement
    return NextResponse.json({
      requests: requests.map(({ phoneNumber: _phone, ...r }) => r),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/* POST /api/escort — créer une demande */
export async function POST(req: NextRequest) {
  try {
    const session = await requireApiAuth();
    const userId = session.user.id;

    const body = await req.json();
    const { eventId, title, message, photoUrl, genderPreference, phoneNumber } = body as {
      eventId: string;
      title: string;
      message: string;
      photoUrl?: string;
      genderPreference?: "HOMME" | "FEMME" | "INDIFFERENT";
      phoneNumber?: string;   // ← NOUVEAU
    };

    if (!eventId) throw badRequest("eventId est requis.");
    if (!title?.trim()) throw badRequest("Le titre est obligatoire.");
    if (!message?.trim()) throw badRequest("Le message est obligatoire.");

    const event = await prisma.event.findUnique({
      where: { id: eventId, published: true },
      select: { id: true },
    });
    if (!event) throw badRequest("Événement introuvable.");

    const existing = await prisma.escortRequest.findFirst({
      where: { eventId, requesterId: userId, status: "OPEN" },
    });
    if (existing) throw badRequest("Vous avez déjà une demande ouverte pour cet événement.");

    const request = await prisma.escortRequest.create({
      data: {
        eventId,
        requesterId: userId,
        title: title.trim(),
        message: message.trim(),
        photoUrl: photoUrl?.trim() || null,
        genderPreference: genderPreference ?? "INDIFFERENT",
        phoneNumber: phoneNumber?.trim() || null,   // ← NOUVEAU
        status: "OPEN",
      },
      include: {
        requester: {
          select: { id: true, name: true, filiere: true, promotion: true },
        },
      },
    });

    return NextResponse.json({ request, message: "Votre demande a été publiée." }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

/* DELETE /api/escort?requestId= */
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireApiAuth();
    const requestId = req.nextUrl.searchParams.get("requestId");
    if (!requestId) throw badRequest("requestId requis.");

    const request = await prisma.escortRequest.findFirst({
      where: { id: requestId, requesterId: session.user.id },
    });
    if (!request) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });

    await prisma.escortRequest.update({
      where: { id: requestId },
      data: { status: "CLOSED" },
    });

    return NextResponse.json({ message: "Votre demande a été retirée." });
  } catch (error) {
    return errorResponse(error);
  }
}