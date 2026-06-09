import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, notFound, forbidden } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/* ── DELETE /api/music/[id] — supprimer sa propre suggestion ─── */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireApiAuth();
        const { id } = await params;

        const suggestion = await prisma.musicSuggestion.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!suggestion) throw notFound("Suggestion introuvable.");

        const isOwner = suggestion.userId === session.user.id;
        const isAdmin = session.user.role === "ADMIN";

        if (!isOwner && !isAdmin) {
            throw forbidden("Vous ne pouvez supprimer que vos propres suggestions.");
        }

        await prisma.musicSuggestion.delete({ where: { id } });

        return NextResponse.json({ message: "Suggestion supprimée." });
    } catch (error) {
        return errorResponse(error);
    }
}

/* ── PATCH /api/music/[id] — admin : approuver / rejeter ─────── */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await requireApiAuth();
        const { id } = await params;

        if (session.user.role !== "ADMIN") {
            throw forbidden("Réservé aux administrateurs.");
        }

        const body = await req.json();
        const { approved } = body as { approved?: boolean };

        if (typeof approved !== "boolean") {
            return NextResponse.json(
                { error: "Le champ 'approved' (boolean) est requis." },
                { status: 400 }
            );
        }

        const suggestion = await prisma.musicSuggestion.findUnique({
            where: { id },
        });
        if (!suggestion) throw notFound("Suggestion introuvable.");

        const updated = await prisma.musicSuggestion.update({
            where: { id },
            data: { approved },
            include: { user: { select: { name: true } }, event: { select: { title: true } } },
        });

        return NextResponse.json({
            suggestion: updated,
            message: approved ? "Suggestion approuvée." : "Suggestion rejetée.",
        });
    } catch (error) {
        return errorResponse(error);
    }
}