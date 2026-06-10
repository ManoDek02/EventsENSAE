// src/app/api/admin/participants/[eventId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, forbidden, notFound } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { buildTicketQrContent, generateQrBuffer } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { formatEventDate, formatEventTime } from "@/lib/events";
import { notifyWaitlistOnCancellation } from "@/lib/reminders";

type RouteParams = { params: Promise<{ eventId: string }> };

async function requireAdminApi() {
    const session = await requireApiAuth();
    if (session.user.role !== "ADMIN") throw forbidden();
    return session;
}

/* GET /api/admin/participants/[eventId]?format=csv */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        await requireAdminApi();
        const { eventId } = await params;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, title: true },
        });
        if (!event) throw notFound("Événement introuvable.");

        const tickets = await prisma.ticket.findMany({
            where: { eventId },
            include: {
                user: {
                    select: { name: true, email: true, filiere: true, promotion: true },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        const waitlist = await prisma.waitlistEntry.findMany({
            where: { eventId },
            include: {
                user: {
                    select: { name: true, email: true, filiere: true, promotion: true },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        const format = req.nextUrl.searchParams.get("format");

        if (format === "csv") {
            const rows = [
                ["Nom", "Email", "Filière", "Promotion", "Statut billet", "Code QR", "Date inscription"],
                ...tickets.map((t) => [
                    t.user.name, t.user.email, t.user.filiere ?? "",
                    t.user.promotion ?? "", t.status, t.qrCode,
                    t.createdAt.toLocaleDateString("fr-FR"),
                ]),
                ...waitlist.map((w) => [
                    w.user.name, w.user.email, w.user.filiere ?? "",
                    w.user.promotion ?? "", "LISTE_ATTENTE", "",
                    w.createdAt.toLocaleDateString("fr-FR"),
                ]),
            ];
            const csv = rows.map((row) =>
                row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
            ).join("\n");

            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="participants-${event.title.replace(/\s+/g, "-").toLowerCase()}.csv"`,
                },
            });
        }

        return NextResponse.json({
            event: { id: event.id, title: event.title },
            tickets: tickets.map((t) => ({
                id: t.id, qrCode: t.qrCode, status: t.status,
                createdAt: t.createdAt.toISOString(), user: t.user,
            })),
            waitlist: waitlist.map((w) => ({
                id: w.id, createdAt: w.createdAt.toISOString(), user: w.user,
            })),
            stats: {
                total: tickets.length,
                confirmed: tickets.filter((t) => t.status === "CONFIRMED").length,
                pending: tickets.filter((t) => t.status === "PENDING").length,
                pendingReview: tickets.filter((t) => t.status === "PENDING_REVIEW").length,
                scanned: tickets.filter((t) => t.status === "SCANNED").length,
                cancelled: tickets.filter((t) => t.status === "CANCELLED").length,
                waitlistCount: waitlist.length,
            },
        });
    } catch (error) {
        return errorResponse(error);
    }
}

/* PATCH /api/admin/participants/[eventId] — changer statut + email si CONFIRMED */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        await requireAdminApi();
        const { eventId } = await params;
        const body = await req.json();
        const { ticketId, status } = body as { ticketId: string; status: string };

        const VALID = ["CONFIRMED", "CANCELLED", "SCANNED", "PENDING", "PENDING_REVIEW"];
        if (!ticketId || !VALID.includes(status)) {
            return NextResponse.json(
                { error: "ticketId et status valide sont requis." },
                { status: 400 }
            );
        }

        const ticket = await prisma.ticket.findFirst({
            where: { id: ticketId, eventId },
            include: {
                event: true,
                user: { select: { name: true, email: true } },
            },
        });
        if (!ticket) throw notFound("Billet introuvable.");

        const previousStatus = ticket.status;

        const updated = await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: status as "CONFIRMED" | "CANCELLED" | "SCANNED" | "PENDING" | "PENDING_REVIEW" },
        });

        /* ── Email confirmation : PENDING / PENDING_REVIEW → CONFIRMED ── */
        if (
            status === "CONFIRMED" &&
            (previousStatus === "PENDING_REVIEW" || previousStatus === "PENDING") &&
            ticket.user.email
        ) {
            try {
                const qrContent = buildTicketQrContent(ticket.qrCode);
                const qrBuffer = await generateQrBuffer(qrContent);

                await sendTicketEmail(
                    ticket.user.email,
                    ticket.user.name,
                    ticket.event.title,
                    `${formatEventDate(ticket.event.date)} à ${formatEventTime(ticket.event.date)}`,
                    qrBuffer
                );
            } catch (emailError) {
                console.error("[PARTICIPANTS] Erreur envoi email billet:", emailError);
                // Ne pas bloquer la confirmation si l'email échoue
            }
        }

        /* ── Notifier la liste d'attente si billet annulé ── */
        if (status === "CANCELLED" && previousStatus !== "CANCELLED") {
            notifyWaitlistOnCancellation(eventId).catch((err) =>
                console.error("[PARTICIPANTS] Erreur notification liste d'attente:", err)
            );
        }

        return NextResponse.json({
            ticket: updated,
            message: status === "CONFIRMED"
                ? "Billet confirmé. Email avec QR code envoyé à l'étudiant."
                : status === "CANCELLED"
                    ? "Billet annulé. Le premier sur liste d'attente a été notifié."
                    : "Statut mis à jour.",
        });
    } catch (error) {
        return errorResponse(error);
    }
}