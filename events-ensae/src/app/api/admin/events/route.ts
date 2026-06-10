// src/app/api/admin/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse, forbidden, badRequest } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

async function requireAdminApi() {
    const session = await requireApiAuth();
    if (session.user.role !== "ADMIN") throw forbidden();
    return session;
}

/* GET /api/admin/events — liste tous les événements (publiés ou non) */
export async function GET() {
    try {
        await requireAdminApi();

        const events = await prisma.event.findMany({
            orderBy: { date: "asc" },
            include: {
                _count: {
                    select: {
                        tickets: { where: { status: "CONFIRMED" } },
                        waitlistEntries: true,
                    },
                },
            },
        });

        return NextResponse.json({ events });
    } catch (error) {
        return errorResponse(error);
    }
}

/* POST /api/admin/events — créer un événement */
export async function POST(req: NextRequest) {
    try {
        await requireAdminApi();

        const body = await req.json();
        const {
            title, description, category, date, location,
            imageUrl, price, capacity, deadline, published,
            tags, allowsMusicSuggestions,
        } = body;

        if (!title?.trim()) return NextResponse.json({ error: "Le titre est obligatoire." }, { status: 400 });
        if (!description?.trim()) return NextResponse.json({ error: "La description est obligatoire." }, { status: 400 });
        if (!category) return NextResponse.json({ error: "La catégorie est obligatoire." }, { status: 400 });
        if (!date) return NextResponse.json({ error: "La date est obligatoire." }, { status: 400 });
        if (!location?.trim()) return NextResponse.json({ error: "Le lieu est obligatoire." }, { status: 400 });
        if (capacity == null || capacity < 1) return NextResponse.json({ error: "La capacité doit être au moins 1." }, { status: 400 });

        const VALID_CATEGORIES = ["SORTIE_PEDAGOGIQUE", "CHAMPIONNAT", "GALA", "CONFERENCE", "AUTRE"];
        if (!VALID_CATEGORIES.includes(category)) {
            throw badRequest("Catégorie invalide.");
        }

        const event = await prisma.event.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                category,
                date: new Date(date),
                location: location.trim(),
                imageUrl: imageUrl?.trim() || null,
                price: Number(price) || 0,
                capacity: Number(capacity),
                deadline: deadline ? new Date(deadline) : null,
                published: Boolean(published),
                tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
                allowsMusicSuggestions: Boolean(allowsMusicSuggestions),
            },
        });

        return NextResponse.json({ event, message: "Événement créé avec succès." }, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}