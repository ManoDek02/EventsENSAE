// src/app/api/admin/musiques/announce/route.ts
// POST /api/admin/musiques/announce
// Envoie la playlist finale par email à tous les participants confirmés.

import { NextRequest, NextResponse } from "next/server";
import { errorResponse, forbidden, notFound, badRequest } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { sendPlaylistAnnouncementEmail } from "@/lib/email";
import { formatEventDate, formatEventTime } from "@/lib/events";
import { requireAdminApi } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
    try {
        await requireAdminApi();
        const body = await req.json();
        const { eventId } = body as { eventId: string };

        if (!eventId) throw badRequest("eventId est requis.");

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                tickets: {
                    where: { status: "CONFIRMED" },
                    include: { user: { select: { name: true, email: true } } },
                },
                musicSuggestions: {
                    where: { approved: true },
                    include: { _count: { select: { votes: true } } },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!event) throw notFound("Événement introuvable.");

        if (event.musicSuggestions.length === 0) {
            throw badRequest("Aucune musique approuvée pour cet événement.");
        }

        /* Trier par votes décroissants */
        const tracks = event.musicSuggestions
            .sort((a, b) => b._count.votes - a._count.votes)
            .map((s) => ({ title: s.title, artist: s.artist, votes: s._count.votes }));

        const eventUrl = `${process.env.NEXTAUTH_URL}/events/${eventId}`;
        const eventDate = `${formatEventDate(event.date)} à ${formatEventTime(event.date)}`;

        let sent = 0;
        let errors = 0;

        for (const ticket of event.tickets) {
            if (!ticket.user.email) continue;
            try {
                await sendPlaylistAnnouncementEmail(
                    ticket.user.email,
                    ticket.user.name,
                    event.title,
                    eventDate,
                    tracks,
                    eventUrl
                );
                sent++;
            } catch (err) {
                console.error(`[PLAYLIST_ANNOUNCE] Erreur pour ${ticket.user.email}:`, err);
                errors++;
            }
        }

        return NextResponse.json({
            message: `Playlist annoncée : ${sent} email(s) envoyé(s), ${errors} erreur(s).`,
            sent,
            errors,
        });
    } catch (error) {
        return errorResponse(error);
    }
}