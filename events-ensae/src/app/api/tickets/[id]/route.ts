// src/app/api/tickets/[id]/route.ts
// DELETE — annuler un billet DRAFT ou PENDING_REVIEW (avant confirmation admin)

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, notFound, badRequest } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { notifyWaitlistOnCancellation } from "@/lib/reminders";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireApiAuth();
        const { id } = await params;

        const ticket = await prisma.ticket.findFirst({
            where: { id, userId: session.user.id },
            include: {
                event: { select: { title: true } },
            },
        });

        if (!ticket) throw notFound("Billet introuvable.");

        // Seuls les billets DRAFT et PENDING_REVIEW peuvent être annulés par l'étudiant
        if (!["DRAFT", "PENDING_REVIEW"].includes(ticket.status)) {
            throw badRequest(
                ticket.status === "CONFIRMED"
                    ? "Votre billet est déjà confirmé. Contactez l'administration pour l'annuler."
                    : ticket.status === "CANCELLED"
                        ? "Ce billet est déjà annulé."
                        : "Ce billet ne peut pas être annulé.",
                "CANNOT_CANCEL"
            );
        }

        await prisma.ticket.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        // Si PENDING_REVIEW → notifier la liste d'attente (une place se libère)
        if (ticket.status === "PENDING_REVIEW") {
            notifyWaitlistOnCancellation(ticket.eventId).catch(console.error);
        }

        return NextResponse.json({
            message: "Votre réservation a été annulée.",
        });
    } catch (error) {
        return errorResponse(error);
    }
}