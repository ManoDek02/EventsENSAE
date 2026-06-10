// src/app/api/admin/scanner/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, forbidden } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { formatEventDate, formatEventTime } from "@/lib/events";

async function requireAdminApi() {
    const session = await requireApiAuth();
    if (session.user.role !== "ADMIN") throw forbidden();
    return session;
}

/* ─── Extraire le qrCode depuis une URL ou un code brut ─────── */
function extractQrCode(raw: string): string {
    const trimmed = raw.trim();
    // Si c'est une URL complète (ex: https://ensae.sn/billets/abc-123)
    try {
        const url = new URL(trimmed);
        const segments = url.pathname.split("/").filter(Boolean);
        // Chercher le segment après "billets"
        const idx = segments.indexOf("billets");
        if (idx !== -1 && segments[idx + 1]) {
            return segments[idx + 1];
        }
    } catch {
        // Pas une URL — traiter comme code brut
    }
    return trimmed;
}

/* ─── POST /api/admin/scanner ─────────────────────────────────
   Body: { qrRaw: string, eventId?: string }
   - qrRaw : l'URL ou le code UUID extrait du QR
   - eventId : optionnel — si fourni, vérifie que le billet appartient à cet événement
*/
export async function POST(req: NextRequest) {
    try {
        await requireAdminApi();

        const body = await req.json();
        const { qrRaw, eventId } = body as { qrRaw?: string; eventId?: string };

        if (!qrRaw?.trim()) {
            return NextResponse.json(
                { ok: false, code: "MISSING_QR", message: "Code QR manquant." },
                { status: 400 }
            );
        }

        const qrCode = extractQrCode(qrRaw);

        // Rechercher le billet par qrCode
        const ticket = await prisma.ticket.findUnique({
            where: { qrCode },
            include: {
                event: true,
                user: {
                    select: { name: true, email: true, filiere: true, promotion: true },
                },
            },
        });

        // Billet introuvable
        if (!ticket) {
            return NextResponse.json({
                ok: false,
                code: "NOT_FOUND",
                message: "Billet introuvable. Ce QR code n'est pas reconnu.",
            });
        }

        // Mauvais événement
        if (eventId && ticket.eventId !== eventId) {
            return NextResponse.json({
                ok: false,
                code: "WRONG_EVENT",
                message: `Ce billet est pour l'événement "${ticket.event.title}", pas celui sélectionné.`,
                ticket: serializeTicket(ticket),
            });
        }

        // Déjà scanné
        if (ticket.status === "SCANNED") {
            return NextResponse.json({
                ok: false,
                code: "ALREADY_SCANNED",
                message: "Ce billet a déjà été utilisé à l'entrée.",
                ticket: serializeTicket(ticket),
            });
        }

        // Annulé
        if (ticket.status === "CANCELLED") {
            return NextResponse.json({
                ok: false,
                code: "CANCELLED",
                message: "Ce billet a été annulé et n'est plus valide.",
                ticket: serializeTicket(ticket),
            });
        }

        // En attente de paiement
        if (ticket.status === "PENDING") {
            return NextResponse.json({
                ok: false,
                code: "PENDING",
                message: "Ce billet est en attente de confirmation de paiement.",
                ticket: serializeTicket(ticket),
            });
        }

        // CONFIRMED → passer à SCANNED
        const updated = await prisma.ticket.update({
            where: { id: ticket.id },
            data: { status: "SCANNED" },
            include: {
                event: true,
                user: {
                    select: { name: true, email: true, filiere: true, promotion: true },
                },
            },
        });

        return NextResponse.json({
            ok: true,
            code: "VALID",
            message: "Billet valide. Entrée autorisée.",
            ticket: serializeTicket(updated),
        });
    } catch (error) {
        return errorResponse(error);
    }
}

/* ─── GET /api/admin/scanner?q= — recherche manuelle ──────────
   Recherche par : email, nom, code billet (qrCode)
*/
export async function GET(req: NextRequest) {
    try {
        await requireAdminApi();

        const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
        const eventId = req.nextUrl.searchParams.get("eventId") ?? undefined;

        if (q.length < 2) {
            return NextResponse.json({ tickets: [] });
        }

        const tickets = await prisma.ticket.findMany({
            where: {
                ...(eventId ? { eventId } : {}),
                OR: [
                    { qrCode: { contains: q, mode: "insensitive" } },
                    { user: { name: { contains: q, mode: "insensitive" } } },
                    { user: { email: { contains: q, mode: "insensitive" } } },
                ],
            },
            include: {
                event: { select: { id: true, title: true, date: true } },
                user: {
                    select: { name: true, email: true, filiere: true, promotion: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json({
            tickets: tickets.map(serializeTicket),
        });
    } catch (error) {
        return errorResponse(error);
    }
}

/* ─── Sérialisation commune ─────────────────────────────────── */
function serializeTicket(ticket: {
    id: string;
    qrCode: string;
    status: string;
    createdAt: Date;
    event: { id: string; title: string; date: Date; location?: string };
    user: { name: string; email: string; filiere: string | null; promotion: string | null };
}) {
    return {
        id: ticket.id,
        qrCode: ticket.qrCode,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        event: {
            id: ticket.event.id,
            title: ticket.event.title,
            date: formatEventDate(ticket.event.date),
            time: formatEventTime(ticket.event.date),
            location: "location" in ticket.event ? ticket.event.location : undefined,
        },
        user: ticket.user,
    };
}