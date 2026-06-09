import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

const FILIERES = [
    "Statistique", "Démographie", "Économie",
    "Informatique Statistique", "Planification", "Autre",
];

const PROMOTIONS = [
    "1ère année", "2ème année", "3ème année", "Master 1", "Master 2",
];

/* GET /api/profile — retourne le profil courant */
export async function GET() {
    try {
        const session = await requireApiAuth();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                filiere: true,
                promotion: true,
                emailVerified: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ user });
    } catch (error) {
        return errorResponse(error);
    }
}

/* PATCH /api/profile — met à jour nom, filière, promotion */
export async function PATCH(req: NextRequest) {
    try {
        const session = await requireApiAuth();

        const body = await req.json();
        const { name, filiere, promotion } = body as {
            name?: string;
            filiere?: string;
            promotion?: string;
        };

        /* ─── Validation ──────────────────────────────────────── */
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length === 0) {
                return NextResponse.json(
                    { error: "Le nom complet est obligatoire." },
                    { status: 400 }
                );
            }
            if (name.trim().length > 100) {
                return NextResponse.json(
                    { error: "Le nom ne peut pas dépasser 100 caractères." },
                    { status: 400 }
                );
            }
        }

        if (filiere !== undefined && filiere !== "" && !FILIERES.includes(filiere)) {
            return NextResponse.json(
                { error: "Filière invalide." },
                { status: 400 }
            );
        }

        if (promotion !== undefined && promotion !== "" && !PROMOTIONS.includes(promotion)) {
            return NextResponse.json(
                { error: "Promotion invalide." },
                { status: 400 }
            );
        }

        /* ─── Mise à jour ─────────────────────────────────────── */
        const updated = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(name?.trim() ? { name: name.trim() } : {}),
                filiere: filiere === "" ? null : filiere,
                promotion: promotion === "" ? null : promotion,
            },
            select: {
                id: true,
                name: true,
                email: true,
                filiere: true,
                promotion: true,
                role: true,
            },
        });

        return NextResponse.json({ user: updated });
    } catch (error) {
        return errorResponse(error);
    }
}