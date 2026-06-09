import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/music/events
 * Retourne les événements publiés qui acceptent des suggestions musicales.
 * Utilisé par le formulaire de proposition pour peupler la liste déroulante.
 */
export async function GET() {
    try {
        const events = await prisma.event.findMany({
            where: { allowsMusicSuggestions: true, published: true },
            select: { id: true, title: true, category: true, date: true },
            orderBy: { date: "asc" },
        });

        return NextResponse.json({ events });
    } catch (error) {
        return errorResponse(error);
    }
}