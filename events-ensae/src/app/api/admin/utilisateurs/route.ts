// src/app/api/admin/utilisateurs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, forbidden } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-admin";

/* GET /api/admin/utilisateurs?q=&role= */
export async function GET(req: NextRequest) {
    try {
        await requireAdminApi();

        const q = req.nextUrl.searchParams.get("q") ?? "";
        const role = req.nextUrl.searchParams.get("role") ?? "";

        const users = await prisma.user.findMany({
            where: {
                ...(role === "ADMIN" ? { role: "ADMIN" } : role === "STUDENT" ? { role: "STUDENT" } : {}),
                ...(q
                    ? {
                        OR: [
                            { name: { contains: q, mode: "insensitive" } },
                            { email: { contains: q, mode: "insensitive" } },
                        ],
                    }
                    : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                permissions: true,
                filiere: true,
                promotion: true,
                emailVerified: true,
                createdAt: true,
                _count: {
                    select: {
                        tickets: { where: { status: "CONFIRMED" } },
                        musicSuggestions: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ users });
    } catch (error) {
        return errorResponse(error);
    }
}