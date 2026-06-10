// src/app/api/cron/reminders/route.ts
// Endpoint sécurisé pour déclencher les rappels événement.
// À appeler toutes les heures via un cron externe.
//
// Sécurité : vérification du CRON_SECRET en header Authorization.
// Exemple d'appel : curl -H "Authorization: Bearer <CRON_SECRET>" https://ton-app.vercel.app/api/cron/reminders

import { NextRequest, NextResponse } from "next/server";
import { sendEventReminders } from "@/lib/reminders";

export async function GET(req: NextRequest) {
    /* Vérification du secret */
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (secret && authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    try {
        const result = await sendEventReminders();
        return NextResponse.json({
            ok: true,
            message: `Rappels envoyés : ${result.sent} succès, ${result.errors} erreur(s).`,
            ...result,
        });
    } catch (error) {
        console.error("[CRON/REMINDERS]", error);
        return NextResponse.json({ error: "Erreur lors de l'envoi des rappels." }, { status: 500 });
    }
}