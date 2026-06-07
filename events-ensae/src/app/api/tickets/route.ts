import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-api";
import { errorResponse } from "@/lib/api-errors";
import { createTicket } from "@/lib/tickets";
import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/events";

export async function GET() {
  try {
    const session = await requireApiAuth();

    const tickets = await prisma.ticket.findMany({
      where: { userId: session.user.id },
      include: { event: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        eventId: ticket.eventId,
        eventTitle: ticket.event.title,
        eventDate: formatEventDate(ticket.event.date),
        eventLocation: ticket.event.location,
        status: ticket.status,
        qrCode: ticket.status === "CONFIRMED" || ticket.status === "SCANNED" ? ticket.qrCode : null,
        createdAt: ticket.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

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

    const ticket = await createTicket(session.user.id, eventId);

    return NextResponse.json(
      {
        ticket: {
          id: ticket.id,
          eventId: ticket.eventId,
          status: ticket.status,
          eventTitle: ticket.event.title,
        },
        message:
          ticket.status === "CONFIRMED"
            ? "Votre billet est confirmé. Consultez vos billets pour le QR code."
            : "Réservation enregistrée. Finalisez le paiement pour confirmer votre billet.",
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
