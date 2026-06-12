// src/app/api/admin/musiques/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, forbidden } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-admin";


/* GET /api/admin/musiques?eventId=&status=pending|approved|all */
export async function GET(req: NextRequest) {
    try {
        await requireAdminApi();

        const eventId = req.nextUrl.searchParams.get("eventId") ?? undefined;
        const status = req.nextUrl.searchParams.get("status") ?? "all";

        const where: Record<string, unknown> = {};
        if (eventId) where.eventId = eventId;
        if (status === "pending") where.approved = false;
        else if (status === "approved") where.approved = true;

        const suggestions = await prisma.musicSuggestion.findMany({
            where,
            include: {
                event: { select: { id: true, title: true } },
                user: { select: { name: true, email: true } },
                _count: { select: { votes: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ suggestions });
    } catch (error) {
        return errorResponse(error);
    }
}

/* PATCH /api/admin/musiques — approuver/refuser en lot ou marquer playlist finale */
export async function PATCH(req: NextRequest) {
    try {
        await requireAdminApi();
        const body = await req.json();
        const { ids, approved } = body as { ids: string[]; approved: boolean };

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "ids (tableau) est requis." }, { status: 400 });
        }
        if (typeof approved !== "boolean") {
            return NextResponse.json({ error: "approved (boolean) est requis." }, { status: 400 });
        }

        await prisma.musicSuggestion.updateMany({
            where: { id: { in: ids } },
            data: { approved },
        });

        return NextResponse.json({
            message: `${ids.length} suggestion(s) ${approved ? "approuvée(s)" : "refusée(s)"}.`,
        });
    } catch (error) {
        return errorResponse(error);
    }
}