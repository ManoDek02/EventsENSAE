// src/lib/reminders.ts
// Logique de rappels événement — appelé par /api/cron/reminders
// À déclencher toutes les heures via un cron externe (Vercel Cron, GitHub Actions…)

import { prisma } from "@/lib/prisma";
import { sendEventReminderEmail } from "@/lib/email";
import { formatEventDate, formatEventTime } from "@/lib/events";

type ReminderWindow = {
    label: "J-3" | "J-1" | "H-3";
    minHours: number; // borne basse de la fenêtre (heures avant l'événement)
    maxHours: number; // borne haute
};

const WINDOWS: ReminderWindow[] = [
    { label: "J-3", minHours: 71, maxHours: 73 },  // ~72h avant
    { label: "J-1", minHours: 23, maxHours: 25 },  // ~24h avant
    { label: "H-3", minHours: 2, maxHours: 4 },  // ~3h avant
];

export async function sendEventReminders(): Promise<{
    sent: number;
    errors: number;
}> {
    const now = new Date();
    let sent = 0;
    let errors = 0;

    for (const window of WINDOWS) {
        const minDate = new Date(now.getTime() + window.minHours * 60 * 60 * 1000);
        const maxDate = new Date(now.getTime() + window.maxHours * 60 * 60 * 1000);

        /* Événements dans la fenêtre temporelle */
        const events = await prisma.event.findMany({
            where: {
                published: true,
                date: { gte: minDate, lte: maxDate },
            },
            include: {
                tickets: {
                    where: { status: "CONFIRMED" },
                    include: {
                        user: { select: { name: true, email: true } },
                    },
                },
            },
        });

        for (const event of events) {
            const eventUrl = `${process.env.NEXTAUTH_URL}/profile/tickets`;
            const eventDate = `${formatEventDate(event.date)} à ${formatEventTime(event.date)}`;

            for (const ticket of event.tickets) {
                if (!ticket.user.email) continue;
                try {
                    await sendEventReminderEmail(
                        ticket.user.email,
                        ticket.user.name,
                        event.title,
                        eventDate,
                        event.location,
                        eventUrl,
                        window.label
                    );
                    sent++;
                } catch (err) {
                    console.error(`[REMINDER] Erreur pour ${ticket.user.email}:`, err);
                    errors++;
                }
            }
        }
    }

    return { sent, errors };
}

/* ─── Place libérée — à appeler quand un billet est annulé ──── */
export async function notifyWaitlistOnCancellation(
    eventId: string
): Promise<void> {
    /* Récupérer le premier sur la liste d'attente */
    const entry = await prisma.waitlistEntry.findFirst({
        where: { eventId },
        orderBy: { createdAt: "asc" },
        include: {
            user: { select: { name: true, email: true } },
            event: { select: { title: true, date: true } },
        },
    });

    if (!entry || !entry.user.email) return;

    const eventUrl = `${process.env.NEXTAUTH_URL}/events/${eventId}`;
    const eventDate = `${formatEventDate(entry.event.date)} à ${formatEventTime(entry.event.date)}`;

    try {
        const { sendWaitlistAvailableEmail } = await import("@/lib/email");
        await sendWaitlistAvailableEmail(
            entry.user.email,
            entry.user.name,
            entry.event.title,
            eventDate,
            eventUrl
        );
    } catch (err) {
        console.error("[WAITLIST_NOTIFY] Erreur:", err);
    }
}