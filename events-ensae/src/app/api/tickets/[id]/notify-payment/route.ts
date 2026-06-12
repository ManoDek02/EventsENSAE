// src/app/api/tickets/[id]/notify-payment/route.ts
// Vérification de capacité ici (et non à la création) + DRAFT → PENDING_REVIEW

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, notFound, badRequest } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { sendPaymentNotificationEmail } from "@/lib/email";
import { formatEventDate, formatEventTime } from "@/lib/events";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireApiAuth();
    const { id } = await params;

    const body = await req.json();
    const { paymentProofUrl } = body as { paymentProofUrl?: string };

    if (!paymentProofUrl?.trim()) {
      return NextResponse.json(
        { error: "Veuillez uploader une preuve de paiement avant de confirmer." },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id, userId: session.user.id },
      include: {
        event: {
          select: {
            id: true, title: true, date: true,
            price: true, capacity: true, adminEmail: true,
          },
        },
        ticketType: { select: { name: true, price: true, seats: true } },
        user: { select: { name: true, email: true, filiere: true, promotion: true } },
      },
    });

    if (!ticket) throw notFound("Billet introuvable.");

    if (ticket.status !== "DRAFT" && ticket.status !== "PENDING") {
      throw badRequest(
        ticket.status === "PENDING_REVIEW"
          ? "Votre paiement a déjà été signalé. L'admin va vérifier."
          : "Ce billet n'est pas en attente de paiement.",
        "INVALID_STATUS"
      );
    }

    const effectivePrice = ticket.ticketType?.price ?? ticket.event.price;
    const requiredSeats = ticket.ticketType?.seats ?? 1;

    if (effectivePrice === 0) {
      throw badRequest("Cet événement est gratuit.", "FREE_EVENT");
    }

    /* ── Vérifier la capacité au moment du paiement ──────── */
    const ticketsWithSeats = await prisma.ticket.findMany({
      where: {
        eventId: ticket.eventId,
        status: { in: ["CONFIRMED", "PENDING", "PENDING_REVIEW"] },
        id: { not: ticket.id }, // exclure le billet actuel
      },
      include: { ticketType: { select: { seats: true } } },
    });

    const occupiedSeats = ticketsWithSeats.reduce(
      (sum, t) => sum + (t.ticketType?.seats ?? 1), 0
    );

    if (occupiedSeats + requiredSeats > ticket.event.capacity) {
      const remaining = ticket.event.capacity - occupiedSeats;
      if (remaining <= 0) {
        return NextResponse.json(
          { error: "Désolé, l'événement est complet. Votre réservation a été annulée." },
          { status: 400 }
        );
      }
      if (requiredSeats > 1) {
        return NextResponse.json(
          { error: `Il ne reste que ${remaining} place${remaining > 1 ? "s" : ""} — insuffisant pour un billet Couple.` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Désolé, l'événement est complet. Votre réservation a été annulée." },
        { status: 400 }
      );
    }

    /* ── Référence du billet ───────────────────────────────── */
    const reference = `${ticket.user.name.split(" ")[0].toUpperCase()}-${ticket.qrCode.slice(0, 8).toUpperCase()}`;

    /* ── Passer DRAFT/PENDING → PENDING_REVIEW ─────────────── */
    await prisma.ticket.update({
      where: { id },
      data: {
        status: "PENDING_REVIEW",
        paymentProofUrl: paymentProofUrl.trim(),
      },
    });

    /* ── Email admin ───────────────────────────────────────── */
    const adminEmail =
      ticket.event.adminEmail?.trim() ||
      process.env.SMTP_USER ||
      "";

    if (adminEmail) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
        await sendPaymentNotificationEmail({
          adminEmail,
          studentName: ticket.user.name,
          studentFiliere: ticket.user.filiere,
          studentPromotion: ticket.user.promotion,
          eventTitle: ticket.event.title,
          eventDate: `${formatEventDate(ticket.event.date)} à ${formatEventTime(ticket.event.date)}`,
          amount: effectivePrice,
          reference,
          ticketTypeName: ticket.ticketType?.name ?? null,
          paymentProofUrl: paymentProofUrl.trim(),
          participantsUrl: `${baseUrl}/admin/participants/${ticket.event.id}`,
        });
      } catch (emailError) {
        console.error("[NOTIFY_PAYMENT] Erreur email admin:", emailError);
      }
    }

    return NextResponse.json({
      message: "Paiement signalé. L'administrateur a été notifié et va vérifier votre billet.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}