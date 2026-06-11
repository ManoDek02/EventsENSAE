// src/app/api/tickets/[id]/notify-payment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, notFound, forbidden, badRequest } from "@/lib/api-errors";
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

    /* ── Récupérer le billet avec toutes les infos nécessaires ── */
    const ticket = await prisma.ticket.findFirst({
      where: { id, userId: session.user.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            price: true,
            adminEmail: true,
          },
        },
        ticketType: { select: { name: true, price: true } },
        user: {
          select: { name: true, email: true, filiere: true, promotion: true },
        },
      },
    });

    if (!ticket) throw notFound("Billet introuvable.");

    if (ticket.status !== "PENDING") {
      throw badRequest(
        ticket.status === "PENDING_REVIEW"
          ? "Votre paiement a déjà été signalé. L'admin va vérifier."
          : "Ce billet n'est pas en attente de paiement.",
        "INVALID_STATUS"
      );
    }

    const effectivePrice = ticket.ticketType?.price ?? ticket.event.price;
    if (effectivePrice === 0) {
      throw badRequest("Cet événement est gratuit.", "FREE_EVENT");
    }

    /* ── Référence du billet ───────────────────────────────── */
    const reference = `${ticket.user.name.split(" ")[0].toUpperCase()}-${ticket.qrCode.slice(0, 8).toUpperCase()}`;

    /* ── Mettre à jour le statut et sauvegarder la preuve ──── */
    await prisma.ticket.update({
      where: { id },
      data: {
        status: "PENDING_REVIEW",
        paymentProofUrl: paymentProofUrl.trim(),
      },
    });

    /* ── Déterminer l'email admin destinataire ─────────────── */
    const adminEmail =
      ticket.event.adminEmail?.trim() ||
      process.env.SMTP_USER ||
      "";

    if (!adminEmail) {
      console.error("[NOTIFY_PAYMENT] Aucun email admin configuré.");
    } else {
      try {
        const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
        const participantsUrl = `${baseUrl}/admin/participants/${ticket.event.id}`;

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
          participantsUrl,
        });
      } catch (emailError) {
        console.error("[NOTIFY_PAYMENT] Erreur envoi email admin:", emailError);
        // Ne pas bloquer la notification si l'email échoue
      }
    }

    return NextResponse.json({
      message: "Paiement signalé. L'administrateur a été notifié et va vérifier votre billet.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}