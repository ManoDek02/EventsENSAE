// src/app/api/admin/events/[id]/ticket-types/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, forbidden, notFound } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-admin";

type RouteParams = { params: Promise<{ id: string }> };


/* GET /api/admin/events/[id]/ticket-types */
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        await requireAdminApi();
        const { id: eventId } = await params;

        const ticketTypes = await prisma.ticketType.findMany({
            where: { eventId },
            orderBy: { createdAt: "asc" },
            include: {
                _count: {
                    select: {
                        tickets: { where: { status: { in: ["CONFIRMED", "PENDING_REVIEW", "PENDING"] } } },
                    },
                },
            },
        });

        return NextResponse.json({ ticketTypes });
    } catch (error) {
        return errorResponse(error);
    }
}

/* POST /api/admin/events/[id]/ticket-types */
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        await requireAdminApi();
        const { id: eventId } = await params;

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw notFound("Événement introuvable.");

        const body = await req.json();
        const { name, description, price, seats } = body as {
            name: string; description?: string; price: number; seats?: number;
        };

        if (!name?.trim()) {
            return NextResponse.json({ error: "Le nom du type est obligatoire." }, { status: 400 });
        }

        const ticketType = await prisma.ticketType.create({
            data: {
                eventId,
                name: name.trim(),
                description: description?.trim() || null,
                price: Number(price) || 0,
                seats: Number(seats) || 1,
            },
        });

        return NextResponse.json({ ticketType }, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}

/* PUT /api/admin/events/[id]/ticket-types — remplacer tous les types */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        await requireAdminApi();
        const { id: eventId } = await params;

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw notFound("Événement introuvable.");

        const body = await req.json();
        const { ticketTypes } = body as {
            ticketTypes: Array<{
                id?: string; name: string;
                description?: string; price: number; seats?: number;
            }>;
        };

        if (!Array.isArray(ticketTypes)) {
            return NextResponse.json({ error: "ticketTypes doit être un tableau." }, { status: 400 });
        }

        const existingIds = ticketTypes.filter(t => t.id).map(t => t.id as string);
        await prisma.ticketType.deleteMany({
            where: {
                eventId,
                id: { notIn: existingIds },
                tickets: { none: {} },
            },
        });

        const results = await Promise.all(
            ticketTypes.map(async (t) => {
                if (t.id) {
                    return prisma.ticketType.update({
                        where: { id: t.id },
                        data: {
                            name: t.name.trim(),
                            description: t.description?.trim() || null,
                            price: Number(t.price) || 0,
                            seats: Number(t.seats) || 1,
                        },
                    });
                }
                return prisma.ticketType.create({
                    data: {
                        eventId,
                        name: t.name.trim(),
                        description: t.description?.trim() || null,
                        price: Number(t.price) || 0,
                        seats: Number(t.seats) || 1,
                    },
                });
            })
        );

        return NextResponse.json({ ticketTypes: results, message: "Types de billets sauvegardés." });
    } catch (error) {
        return errorResponse(error);
    }
}

/* DELETE /api/admin/events/[id]/ticket-types?typeId= */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        await requireAdminApi();
        const { id: eventId } = await params;
        const typeId = req.nextUrl.searchParams.get("typeId");

        if (!typeId) {
            return NextResponse.json({ error: "typeId est requis." }, { status: 400 });
        }

        const type = await prisma.ticketType.findFirst({
            where: { id: typeId, eventId },
            include: { _count: { select: { tickets: true } } },
        });

        if (!type) throw notFound("Type de billet introuvable.");

        if (type._count.tickets > 0) {
            return NextResponse.json(
                { error: "Impossible de supprimer un type qui a des billets associés." },
                { status: 400 }
            );
        }

        await prisma.ticketType.delete({ where: { id: typeId } });
        return NextResponse.json({ message: "Type supprimé." });
    } catch (error) {
        return errorResponse(error);
    }
}