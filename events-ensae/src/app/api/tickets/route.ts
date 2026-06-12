// src/app/api/tickets/route.ts
// DRAFT : billet créé sans occuper de place, passe en PENDING_REVIEW après paiement signalé

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
      where: {
        userId: session.user.id,
        status: { not: "DRAFT" }, // ← ne pas afficher les brouillons
      },
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

    /* ── Résoudre le type de billet ───────────────────────── */
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

    const isFree = resolvedPrice === 0;

    /* ── Transaction pour les événements payants ──────────── */
    if (!isFree) {
      /* Pour les billets payants, on crée un DRAFT sans vérifier la capacité.
         La capacité sera vérifiée au moment du notify-payment. */

      // Annuler tout DRAFT existant pour cet événement
      await prisma.ticket.updateMany({
        where: { userId, eventId, status: "DRAFT" },
        data: { status: "CANCELLED" },
      });

      // Vérifier qu'il n'y a pas déjà un billet actif (non DRAFT, non CANCELLED)
      const existing = await prisma.ticket.findFirst({
        where: {
          userId, eventId,
          status: { notIn: ["CANCELLED", "DRAFT"] },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Vous avez déjà réservé pour cet événement." },
          { status: 400 }
        );
      }

      const qrCode = randomUUID();
      const ticket = await prisma.ticket.create({
        data: {
          userId, eventId,
          ticketTypeId: resolvedTicketTypeId,
          qrCode,
          status: "DRAFT", // ← ne bloque pas de place
        },
        include: { event: true, ticketType: true },
      });

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
            requiredSeats,
          },
          message: "Réservation enregistrée. Veuillez effectuer le paiement.",
        },
        { status: 201 }
      );
    }

    /* ── Transaction pour les événements gratuits ─────────── */
    const ticket = await prisma.$transaction(async (tx) => {
      const existing = await tx.ticket.findFirst({
        where: { userId, eventId, status: { not: "CANCELLED" } },
      });
      if (existing) throw new Error("ALREADY_BOOKED");

      const ticketsWithSeats = await tx.ticket.findMany({
        where: {
          eventId,
          status: { in: ["CONFIRMED", "PENDING", "PENDING_REVIEW"] },
        },
        include: { ticketType: { select: { seats: true } } },
      });

      const occupiedSeats = ticketsWithSeats.reduce(
        (sum, t) => sum + (t.ticketType?.seats ?? 1), 0
      );

      if (occupiedSeats + requiredSeats > event.capacity) {
        const remaining = event.capacity - occupiedSeats;
        if (remaining <= 0) throw new Error("SOLD_OUT");
        if (requiredSeats > 1) throw new Error(`NOT_ENOUGH_SEATS:${remaining}`);
        throw new Error("SOLD_OUT");
      }

      const qrCode = randomUUID();
      return tx.ticket.create({
        data: {
          userId, eventId,
          ticketTypeId: resolvedTicketTypeId,
          qrCode,
          status: "CONFIRMED",
        },
        include: { event: true, ticketType: true },
      });
    }, { isolationLevel: "Serializable" });

    // Email QR pour les événements gratuits
    if (session.user.email) {
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
        message: "Réservation confirmée ! Votre QR code a été envoyé par email.",
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_BOOKED") {
        return NextResponse.json({ error: "Vous avez déjà réservé pour cet événement." }, { status: 400 });
      }
      if (error.message === "SOLD_OUT") {
        return NextResponse.json({ error: "L'événement est complet." }, { status: 400 });
      }
      if (error.message.startsWith("NOT_ENOUGH_SEATS:")) {
        const remaining = error.message.split(":")[1];
        return NextResponse.json({
          error: `Il ne reste que ${remaining} place${Number(remaining) > 1 ? "s" : ""} — insuffisant pour un billet Couple.`,
        }, { status: 400 });
      }
    }
    return errorResponse(error);
  }
}