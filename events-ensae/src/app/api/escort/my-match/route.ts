// src/app/api/escort/my-match/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await requireApiAuth();
        const eventId = req.nextUrl.searchParams.get("eventId");

        if (!eventId) return NextResponse.json({ hasMatch: false });

        // Vérifie si l'utilisateur a une proposition acceptée pour cet événement
        const acceptedProposal = await prisma.escortProposal.findFirst({
            where: {
                proposerId: session.user.id,
                status: "ACCEPTED",
                request: { eventId },
            },
        });

        // Ou si sa propre demande est en statut MATCHED
        const matchedRequest = await prisma.escortRequest.findFirst({
            where: {
                requesterId: session.user.id,
                eventId,
                status: "MATCHED",
            },
        });

        return NextResponse.json({ hasMatch: !!(acceptedProposal || matchedRequest) });
    } catch (error) {
        return errorResponse(error);
    }
}