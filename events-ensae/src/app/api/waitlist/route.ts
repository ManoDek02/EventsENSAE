import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse } from "@/lib/api-errors";
import { joinWaitlist } from "@/lib/tickets";

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiAuth();
    const body = await req.json();
    const eventId = body?.eventId as string | undefined;

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId est requis.", code: "MISSING_EVENT_ID" },
        { status: 400 }
      );
    }

    await joinWaitlist(session.user.id, eventId);

    return NextResponse.json(
      {
        message: "Vous êtes inscrit(e) sur la liste d'attente. Nous vous préviendrons si une place se libère.",
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
