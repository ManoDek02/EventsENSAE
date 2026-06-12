// src/app/api/tickets/route.ts
// Race condition corrigée — vérification + création dans une transaction Prisma

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { buildTicketQrContent, generateQrBuffer } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { formatEventDate, formatEventTime } from "@/lib/events";

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
          ? {
            id: ticket.ticketType.id,
            name: ticket.ticketType.name,
            price: ticket.ticketType.price,
            seats: ticket.ticketType.seats,
          }
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
      return NextResponse.json({ error: "eventId est requis." }, { status: 400 });
    }

    /* ── Validation préliminaire hors transaction ─────────────
       (légère, sans verrou — juste pour retourner des erreurs
       claires avant d'entrer dans la transaction)
    ─────────────────────────────────────────────────────────── */
    const event = await prisma.event.findUnique({
      where: { id: eventId, published: true },
      include: { ticketTypes: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    if (event.deadline && new Date(event.deadline) < new Date()) {
      return NextResponse.json({ error: "Les inscriptions sont closes." }, { status: 400 });
    }

    /* ── Résoudre le type de billet ───────────────────────────
       (hors transaction car pas d'écriture)
    ─────────────────────────────────────────────────────────── */
    let resolvedPrice = event.price;
    let resolvedTicketTypeId: string | null = null;
    let requiredSeats = 1;

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
      requiredSeats = ticketType.seats ?? 1;
    }

    /* ══════════════════════════════════════════════════════════
       TRANSACTION — vérification atomique + création du billet
       Toutes les lectures critiques + l'écriture sont dans le
       même bloc transactionnel avec isolation SERIALIZABLE pour
       éviter les race conditions de surréservation.
    ══════════════════════════════════════════════════════════ */
    const ticket = await prisma.$transaction(async (tx) => {

      /* 1. Vérifier billet existant (dans la transaction) */
      const existing = await tx.ticket.findFirst({
        where: { userId, eventId, status: { not: "CANCELLED" } },
      });
      if (existing) {
        throw new Error("ALREADY_BOOKED");
      }

      /* 2. Calculer les places occupées (dans la transaction) */
      const ticketsWithSeats = await tx.ticket.findMany({
        where: {
          eventId,
          status: { in: ["CONFIRMED", "PENDING", "PENDING_REVIEW"] },
        },
        include: { ticketType: { select: { seats: true } } },
      });

      const occupiedSeats = ticketsWithSeats.reduce(
        (sum, t) => sum + (t.ticketType?.seats ?? 1),
        0
      );

      /* 3. Vérifier la capacité */
      if (occupiedSeats + requiredSeats > event.capacity) {
        const remaining = event.capacity - occupiedSeats;
        if (remaining <= 0) {
          throw new Error("SOLD_OUT");
        }
        if (requiredSeats > 1) {
          throw new Error(`NOT_ENOUGH_SEATS:${remaining}`);
        }
        throw new Error("SOLD_OUT");
      }

      /* 4. Créer le billet */
      const qrCode = randomUUID();
      const isFree = resolvedPrice === 0;

      return tx.ticket.create({
        data: {
          userId,
          eventId,
          ticketTypeId: resolvedTicketTypeId,
          qrCode,
          status: isFree ? "CONFIRMED" : "PENDING",
        },
        include: { event: true, ticketType: true },
      });
    }, {
      /* Isolation maximale pour éviter les lectures fantômes */
      isolationLevel: "Serializable",
    });

    /* ── Envoi email QR (hors transaction — pas critique) ──── */
    const isFree = resolvedPrice === 0;
    if (isFree && session.user.email) {
      try {
        const qrContent = buildTicketQrContent(ticket.qrCode);
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
              seats: ticket.ticketType.seats,
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
    /* ── Gestion des erreurs métier lancées depuis la transaction */
    if (error instanceof Error) {
      if (error.message === "ALREADY_BOOKED") {
        return NextResponse.json(
          { error: "Vous avez déjà réservé pour cet événement." },
          { status: 400 }
        );
      }
      if (error.message === "SOLD_OUT") {
        return NextResponse.json(
          { error: "L'événement est complet." },
          { status: 400 }
        );
      }
      if (error.message.startsWith("NOT_ENOUGH_SEATS:")) {
        const remaining = error.message.split(":")[1];
        return NextResponse.json(
          {
            error: `Il ne reste que ${remaining} place${Number(remaining) > 1 ? "s" : ""} — insuffisant pour un billet Couple (2 places requises).`,
          },
          { status: 400 }
        );
      }
    }
    return errorResponse(error);
  }
}