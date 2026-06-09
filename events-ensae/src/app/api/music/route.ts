import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, badRequest, notFound } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

const PLATFORMS = ["YOUTUBE", "SPOTIFY", "SOUNDCLOUD", "OTHER"] as const;

/* ── GET /api/music — liste publique des suggestions approuvées ─ */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId") ?? undefined;
        const genre = searchParams.get("genre") ?? undefined;
        const sort = searchParams.get("sort") ?? "votes";

        const suggestions = await prisma.musicSuggestion.findMany({
            where: {
                approved: true,
                ...(eventId ? { eventId } : {}),
                ...(genre ? { genre } : {}),
            },
            include: {
                event: { select: { id: true, title: true } },
                user: { select: { name: true } },
                _count: { select: { votes: true } },
            },
            orderBy:
                sort === "recent"
                    ? { createdAt: "desc" }
                    : { votes: { _count: "desc" } },
        });

        return NextResponse.json({ suggestions });
    } catch (error) {
        return errorResponse(error);
    }
}

/* ── POST /api/music — créer une suggestion ──────────────────── */
export async function POST(req: NextRequest) {
    try {
        const session = await requireApiAuth();
        const body = await req.json();

        const { title, artist, genre, link, platform, eventId } = body as {
            title?: string;
            artist?: string;
            genre?: string;
            link?: string;
            platform?: string;
            eventId?: string;
        };

        /* Validation */
        if (!title?.trim()) throw badRequest("Le titre est obligatoire.");
        if (!artist?.trim()) throw badRequest("L'artiste est obligatoire.");
        if (!link?.trim()) throw badRequest("Le lien est obligatoire.");
        if (!eventId) throw badRequest("L'événement est obligatoire.");

        if (!platform || !PLATFORMS.includes(platform as typeof PLATFORMS[number])) {
            throw badRequest("Plateforme invalide.");
        }

        /* URL valide ? */
        try { new URL(link); } catch {
            throw badRequest("Le lien n'est pas une URL valide.");
        }

        /* L'événement accepte-t-il les suggestions ? */
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, allowsMusicSuggestions: true, published: true },
        });

        if (!event?.published) throw notFound("Événement introuvable.");
        if (!event.allowsMusicSuggestions) {
            throw badRequest(
                "Cet événement n'accepte pas de suggestions musicales.",
                "MUSIC_DISABLED"
            );
        }

        /* Un utilisateur ne peut proposer qu'une fois le même titre/artiste par événement */
        const duplicate = await prisma.musicSuggestion.findFirst({
            where: {
                userId: session.user.id,
                eventId,
                title: { equals: title.trim(), mode: "insensitive" },
                artist: { equals: artist.trim(), mode: "insensitive" },
            },
        });
        if (duplicate) {
            throw badRequest("Vous avez déjà proposé cette musique pour cet événement.");
        }

        const suggestion = await prisma.musicSuggestion.create({
            data: {
                title: title.trim(),
                artist: artist.trim(),
                genre: genre?.trim() || null,
                link: link.trim(),
                platform: platform as typeof PLATFORMS[number],
                eventId,
                userId: session.user.id,
                approved: false,
            },
            include: { event: { select: { title: true } } },
        });

        return NextResponse.json(
            {
                suggestion,
                message:
                    "Votre proposition a été envoyée. Elle sera visible après validation par un administrateur.",
            },
            { status: 201 }
        );
    } catch (error) {
        return errorResponse(error);
    }
}