// src/app/api/tickets/[id]/notify-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, notFound, forbidden, badRequest } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/* POST /api/tickets/[id]/notify-payment
   L'étudiant indique qu'il a effectué le virement.
   PENDING → PENDING_REVIEW
*/
export async function POST(_req: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireApiAuth();
        const { id } = await params;

        const ticket = await prisma.ticket.findFirst({
            where: { id, userId: session.user.id },
            include: { event: { select: { title: true, price: true } } },
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

        if (ticket.event.price === 0) {
            throw badRequest("Cet événement est gratuit.", "FREE_EVENT");
        }

        await prisma.ticket.update({
            where: { id },
            data: { status: "PENDING_REVIEW" },
        });

        return NextResponse.json({
            message: "Paiement signalé. L'administrateur va vérifier et confirmer votre billet.",
        });
    } catch (error) {
        return errorResponse(error);
    }
}