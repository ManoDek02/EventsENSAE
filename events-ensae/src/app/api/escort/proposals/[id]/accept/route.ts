// src/app/api/escort/proposals/[id]/accept/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, notFound } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { sendMatchConfirmedEmail } from "@/lib/email-escort";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  return handleAccept(id, null);
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireApiAuth();
    const { id } = await params;
    return handleAccept(id, session.user.id);
  } catch (error) {
    return errorResponse(error);
  }
}

async function handleAccept(proposalId: string, requesterId: string | null) {
  const proposal = await prisma.escortProposal.findUnique({
    where: { id: proposalId },
    include: {
      request: {
        include: {
          requester: {
            select: {
              id: true, name: true, email: true,
              filiere: true, promotion: true, image: true,
            },
          },
          event: { select: { id: true, title: true } },
        },
      },
      proposer: {
        select: {
          id: true, name: true, email: true,
          filiere: true, promotion: true, image: true,
        },
      },
    },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
  }

  if (requesterId && proposal.request.requesterId !== requesterId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  if (proposal.status !== "PENDING") {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/events/${proposal.request.eventId}/cavaliers?msg=already_handled`
    );
  }

  // Transaction : accepter + refuser les autres + fermer la demande
  await prisma.$transaction(async (tx) => {
    await tx.escortProposal.update({
      where: { id: proposalId },
      data: { status: "ACCEPTED" },
    });
    await tx.escortProposal.updateMany({
      where: { requestId: proposal.requestId, id: { not: proposalId } },
      data: { status: "REJECTED" },
    });
    await tx.escortRequest.update({
      where: { id: proposal.requestId },
      data: { status: "MATCHED" },
    });
  });

  const { requester, event } = proposal.request;
  const { proposer } = proposal;

  // Emails match aux deux avec numéros de téléphone
  try {
    await Promise.all([
      // A reçoit les coordonnées de B (candidat)
      sendMatchConfirmedEmail({
        to: requester.email,
        recipientName: requester.name,
        partnerName: proposer.name,
        partnerFiliere: proposer.filiere,
        partnerPromotion: proposer.promotion,
        partnerEmail: proposer.email,
        partnerPhone: proposal.phoneNumber ?? null,   // ← numéro de B
        partnerPhoto: proposer.image,
        eventTitle: event.title,
      }),
      // B reçoit les coordonnées de A (auteur de la demande)
      sendMatchConfirmedEmail({
        to: proposer.email,
        recipientName: proposer.name,
        partnerName: requester.name,
        partnerFiliere: requester.filiere,
        partnerPromotion: requester.promotion,
        partnerEmail: requester.email,
        partnerPhone: proposal.request.phoneNumber ?? null,   // ← numéro de A
        partnerPhoto: requester.image,
        eventTitle: event.title,
      }),
    ]);
  } catch (err) {
    console.error("[ESCORT] Erreur emails match:", err);
  }

  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/events/${event.id}/cavaliers?msg=matched`
  );
}