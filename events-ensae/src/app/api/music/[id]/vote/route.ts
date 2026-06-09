import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, notFound } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/music/[id]/vote
 * Toggle : vote si absent, retire le vote si présent.
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireApiAuth();
        const { id } = await params;

        const suggestion = await prisma.musicSuggestion.findUnique({
            where: { id },
            select: { id: true, approved: true },
        });

        if (!suggestion?.approved) {
            throw notFound("Suggestion introuvable ou non approuvée.");
        }

        /* Vote existant ? */
        const existing = await prisma.vote.findUnique({
            where: {
                userId_musicSuggestionId: {
                    userId: session.user.id,
                    musicSuggestionId: id,
                },
            },
        });

        if (existing) {
            /* Retirer le vote */
            await prisma.vote.delete({ where: { id: existing.id } });
            return NextResponse.json({ voted: false, message: "Vote retiré." });
        }

        /* Ajouter le vote */
        await prisma.vote.create({
            data: { userId: session.user.id, musicSuggestionId: id },
        });

        return NextResponse.json({ voted: true, message: "Vote enregistré." });
    } catch (error) {
        return errorResponse(error);
    }
}