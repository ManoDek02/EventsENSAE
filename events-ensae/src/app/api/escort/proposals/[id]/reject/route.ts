// src/app/api/escort/proposals/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, notFound } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { sendProposalRejectedEmail } from "@/lib/email-escort";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    return handleReject(id, null);
}

export async function POST(_req: NextRequest, { params }: Params) {
    try {
        const session = await requireApiAuth();
        const { id } = await params;
        return handleReject(id, session.user.id);
    } catch (error) {
        return errorResponse(error);
    }
}

async function handleReject(proposalId: string, requesterId: string | null) {
    const proposal = await prisma.escortProposal.findUnique({
        where: { id: proposalId },
        include: {
            request: {
                include: {
                    event: { select: { id: true, title: true } },
                },
            },
            proposer: { select: { name: true, email: true } },
        },
    });

    if (!proposal) throw notFound("Candidature introuvable.");

    if (requesterId && proposal.request.requesterId !== requesterId) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    if (proposal.status !== "PENDING") {
        return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/events/${proposal.request.eventId}/cavaliers`
        );
    }

    await prisma.escortProposal.update({
        where: { id: proposalId },
        data: { status: "REJECTED" },
    });

    // Email au candidat refusé
    try {
        await sendProposalRejectedEmail({
            to: proposal.proposer.email,
            proposerName: proposal.proposer.name,
            eventTitle: proposal.request.event.title,
        });
    } catch (err) {
        console.error("[ESCORT] Erreur email refus:", err);
    }

    return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/events/${proposal.request.event.id}/cavaliers?msg=rejected`
    );
}