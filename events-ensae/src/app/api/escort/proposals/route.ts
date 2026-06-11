// src/app/api/escort/proposals/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, badRequest, notFound } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import {
    sendNewProposalEmail,
    sendMatchConfirmedEmail,
    sendProposalRejectedEmail,
} from "@/lib/email-escort";

/* POST /api/escort/proposals — envoyer une candidature */
export async function POST(req: NextRequest) {
    try {
        const session = await requireApiAuth();
        const userId = session.user.id;

        const body = await req.json();
        const { requestId, message } = body as { requestId: string; message: string };

        if (!requestId) throw badRequest("requestId est requis.");
        if (!message?.trim()) throw badRequest("Un message personnel est obligatoire.");

        const request = await prisma.escortRequest.findUnique({
            where: { id: requestId },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                event: { select: { title: true } },
            },
        });

        if (!request) throw notFound("Demande introuvable.");
        if (request.status !== "OPEN") throw badRequest("Cette demande n'est plus disponible.");
        if (request.requesterId === userId) throw badRequest("Vous ne pouvez pas postuler à votre propre demande.");

        // Vérifier si déjà postulé
        const existingProposal = await prisma.escortProposal.findUnique({
            where: { requestId_proposerId: { requestId, proposerId: userId } },
        });
        if (existingProposal) throw badRequest("Vous avez déjà envoyé une candidature pour cette demande.");

        // Vérifier si déjà en match
        const alreadyMatched = await prisma.escortProposal.findFirst({
            where: { proposerId: userId, status: "ACCEPTED" },
        });
        if (alreadyMatched) throw badRequest("Vous avez déjà un cavalier / une cavalière confirmé(e).");

        // Récupérer les infos du proposant
        const proposer = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, filiere: true, promotion: true, image: true },
        });
        if (!proposer) throw notFound("Utilisateur introuvable.");

        const proposal = await prisma.escortProposal.create({
            data: { requestId, proposerId: userId, message: message.trim(), status: "PENDING" },
        });

        // Email romantique à l'auteur de la demande
        try {
            const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
            await sendNewProposalEmail({
                to: request.requester.email,
                requesterName: request.requester.name,
                proposerName: proposer.name,
                proposerFiliere: proposer.filiere,
                proposerPromotion: proposer.promotion,
                proposerMessage: message.trim(),
                proposerPhoto: proposer.image,
                acceptUrl: `${baseUrl}/api/escort/proposals/${proposal.id}/accept`,
                rejectUrl: `${baseUrl}/api/escort/proposals/${proposal.id}/reject`,
                eventTitle: request.event.title,
            });
        } catch (err) {
            console.error("[ESCORT] Erreur email proposition:", err);
        }

        return NextResponse.json({
            proposal,
            message: "Votre candidature a été envoyée. L'auteur(e) de la demande a été notifié(e).",
        }, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}