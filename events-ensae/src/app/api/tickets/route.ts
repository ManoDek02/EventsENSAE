// src/app/api/tickets/route.ts

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { buildTicketQrContent, generateQrBuffer } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { formatEventDate, formatEventTime } from "@/lib/events";

/* GET /api/tickets — liste les billets de l'utilisateur */
export async function GET() {
  try {
    const session = await requireApiAuth();

    const tickets = await prisma.ticket.findMany({
      where: { userId: session.user.id },
      include: { event: true, ticketType: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        eventId: ticket.eventId,
        eventTitle: ticket.event.title,
        eventDate: formatEventDate(ticket.event.date),
        eventLocation: ticket.event.location,
        status: ticket.status,
        ticketType: ticket.ticketType
          ? { id: ticket.ticketType.id, name: ticket.ticketType.name }
          : null,
        qrCode:
          ticket.status === "CONFIRMED" || ticket.status === "SCANNED"
            ? ticket.qrCode
            : null,
        createdAt: ticket.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/* POST /api/tickets — créer un billet */
export async function POST(req: NextRequest) {
  try {
    const session = await requireApiAuth();
    const userId = session.user.id;

    const body = await req.json();
    const { eventId, ticketTypeId } = body as {
      eventId: string;
      ticketTypeId?: string;
    };

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId est requis.", code: "MISSING_EVENT_ID" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId, published: true },
      include: {
        _count: {
          select: {
            tickets: {
              where: { status: { in: ["CONFIRMED", "PENDING", "PENDING_REVIEW"] } },
            },
          },
        },
        ticketTypes: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    // Vérifier deadline
    if (event.deadline && new Date(event.deadline) < new Date()) {
      return NextResponse.json({ error: "Les inscriptions sont closes." }, { status: 400 });
    }

    // Vérifier capacité
    if (event._count.tickets >= event.capacity) {
      return NextResponse.json({ error: "L'événement est complet." }, { status: 400 });
    }

    // Vérifier billet existant
    const existing = await prisma.ticket.findFirst({
      where: { userId, eventId, status: { not: "CANCELLED" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà réservé pour cet événement." },
        { status: 400 }
      );
    }

    // Résoudre le prix selon le type de billet
    let resolvedPrice = event.price;
    let resolvedTicketTypeId: string | null = null;

    if (event.ticketTypes.length > 0) {
      if (!ticketTypeId) {
        return NextResponse.json(
          { error: "Veuillez choisir un type de billet." },
          { status: 400 }
        );
      }
      const ticketType = event.ticketTypes.find((t) => t.id === ticketTypeId);
      if (!ticketType) {
        return NextResponse.json({ error: "Type de billet invalide." }, { status: 400 });
      }
      resolvedPrice = ticketType.price;
      resolvedTicketTypeId = ticketType.id;
    }

    const qrCode = randomUUID();
    const isFree = resolvedPrice === 0;

    const ticket = await prisma.ticket.create({
      data: {
        userId,
        eventId,
        ticketTypeId: resolvedTicketTypeId,
        qrCode,
        status: isFree ? "CONFIRMED" : "PENDING",
      },
      include: {
        event: true,
        ticketType: true,
      },
    });

    // Envoyer email QR si gratuit
    if (isFree && session.user.email) {
      try {
        const qrContent = buildTicketQrContent(qrCode);
        const qrBuffer = await generateQrBuffer(qrContent);
        await sendTicketEmail(
          session.user.email,
          session.user.name!,
          event.title,
          `${formatEventDate(event.date)} à ${formatEventTime(event.date)}`,
          qrBuffer
        );
      } catch (emailError) {
        console.error("[TICKET] Erreur email:", emailError);
      }
    }

    return NextResponse.json(
      {
        ticket: {
          id: ticket.id,
          eventId: ticket.eventId,
          status: ticket.status,
          qrCode: ticket.qrCode,
          ticketType: ticket.ticketType
            ? {
              id: ticket.ticketType.id,
              name: ticket.ticketType.name,
              price: ticket.ticketType.price,
            }
            : null,
          price: resolvedPrice,
        },
        message: isFree
          ? "Réservation confirmée ! Votre QR code a été envoyé par email."
          : "Réservation enregistrée. Veuillez effectuer le paiement.",
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}