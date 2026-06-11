// src/app/api/escort/my-proposals/route.ts
// Retourne les propositions reçues sur la demande de l'utilisateur connecté

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await requireApiAuth();
        const eventId = req.nextUrl.searchParams.get("eventId");
        if (!eventId) return NextResponse.json({ proposals: [], myRequest: null });

        // Trouver la demande de l'utilisateur pour cet événement
        const myRequest = await prisma.escortRequest.findFirst({
            where: { requesterId: session.user.id, eventId },
        });

        if (!myRequest) return NextResponse.json({ proposals: [], myRequest: null });

        const proposals = await prisma.escortProposal.findMany({
            where: { requestId: myRequest.id },
            include: {
                proposer: {
                    select: {
                        id: true, name: true, email: true,
                        filiere: true, promotion: true, image: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            myRequest,
            proposals: proposals.map((p) => ({
                id: p.id,
                message: p.message,
                status: p.status,
                createdAt: p.createdAt.toISOString(),
                proposer: p.proposer,
            })),
        });
    } catch (error) {
        return errorResponse(error);
    }
}