// src/app/api/admin/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, forbidden, notFound, badRequest } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

async function requireAdminApi() {
    const session = await requireApiAuth();
    if (session.user.role !== "ADMIN") throw forbidden();
    return session;
}

/* GET /api/admin/events/[id] — détail complet */
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await requireAdminApi();
        const { id } = await params;

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        tickets: { where: { status: "CONFIRMED" } },
                        waitlistEntries: true,
                    },
                },
            },
        });

        if (!event) throw notFound("Événement introuvable.");
        return NextResponse.json({ event });
    } catch (error) {
        return errorResponse(error);
    }
}

/* PATCH /api/admin/events/[id] — modifier un événement */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        await requireAdminApi();
        const { id } = await params;

        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing) throw notFound("Événement introuvable.");

        const body = await req.json();
        const {
            title, description, category, date, location,
            imageUrl, price, capacity, deadline, published,
            tags, allowsMusicSuggestions, cancelled, adminEmail,
        } = body;

        const VALID_CATEGORIES = ["SORTIE_PEDAGOGIQUE", "CHAMPIONNAT", "GALA", "CONFERENCE", "AUTRE"];
        if (category && !VALID_CATEGORIES.includes(category)) {
            throw badRequest("Catégorie invalide.");
        }

        const updated = await prisma.event.update({
            where: { id },
            data: {
                ...(title !== undefined ? { title: title.trim() } : {}),
                ...(description !== undefined ? { description: description.trim() } : {}),
                ...(category !== undefined ? { category } : {}),
                ...(date !== undefined ? { date: new Date(date) } : {}),
                ...(location !== undefined ? { location: location.trim() } : {}),
                ...(imageUrl !== undefined ? { imageUrl: imageUrl?.trim() || null } : {}),
                ...(price !== undefined ? { price: Number(price) || 0 } : {}),
                ...(capacity !== undefined ? { capacity: Number(capacity) } : {}),
                ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
                ...(published !== undefined ? { published: Boolean(published) } : {}),
                ...(tags !== undefined ? { tags: Array.isArray(tags) ? tags.filter(Boolean) : [] } : {}),
                ...(allowsMusicSuggestions !== undefined ? { allowsMusicSuggestions: Boolean(allowsMusicSuggestions) } : {}),
                ...(adminEmail !== undefined ? { adminEmail: adminEmail?.trim() || null } : {}),
                // "cancelled" = dépublié + deadline passée (soft cancel)
                ...(cancelled === true ? { published: false, deadline: new Date(Date.now() - 1000) } : {}),
            },
        });

        return NextResponse.json({ event: updated, message: "Événement mis à jour." });
    } catch (error) {
        return errorResponse(error);
    }
}

/* DELETE /api/admin/events/[id] — supprimer (cascade billets) */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        await requireAdminApi();
        const { id } = await params;

        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing) throw notFound("Événement introuvable.");

        await prisma.event.delete({ where: { id } });
        return NextResponse.json({ message: "Événement supprimé." });
    } catch (error) {
        return errorResponse(error);
    }
}