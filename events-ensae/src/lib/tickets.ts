import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateQrDataUrl } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { formatEventDate, getEventById, isDeadlinePassed, isEventSoldOut } from "@/lib/events";
import { badRequest, notFound } from "@/lib/api-errors";

const ACTIVE_TICKET_STATUSES = ["PENDING", "CONFIRMED"] as const;

export async function getUserTicketForEvent(userId: string, eventId: string) {
  return prisma.ticket.findFirst({
    where: {
      userId,
      eventId,
      status: { in: [...ACTIVE_TICKET_STATUSES] },
    },
  });
}

export async function getUserWaitlistEntry(userId: string, eventId: string) {
  return prisma.waitlistEntry.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
}

export async function createTicket(userId: string, eventId: string) {
  const event = await getEventById(eventId);
  if (!event) throw notFound("Événement introuvable ou non publié.");

  if (isDeadlinePassed(event)) {
    throw badRequest("Les inscriptions sont closes pour cet événement.", "DEADLINE_PASSED");
  }

  if (isEventSoldOut(event)) {
    throw badRequest("Cet événement est complet.", "SOLD_OUT");
  }

  const existing = await getUserTicketForEvent(userId, eventId);
  if (existing) {
    throw badRequest("Vous avez déjà un billet pour cet événement.", "DUPLICATE_TICKET");
  }

  const isFree = event.price === 0;
  const qrCode = randomUUID();
  const status = isFree ? "CONFIRMED" : "PENDING";

  const ticket = await prisma.$transaction(async (tx) => {
    const confirmedCount = await tx.ticket.count({
      where: {
        eventId,
        status: { in: [...ACTIVE_TICKET_STATUSES] },
      },
    });

    if (confirmedCount >= event.capacity) {
      throw badRequest("Cet événement est complet.", "SOLD_OUT");
    }

    return tx.ticket.create({
      data: { userId, eventId, qrCode, status },
      include: {
        event: true,
        user: { select: { name: true, email: true } },
      },
    });
  });

  if (status === "CONFIRMED" && ticket.user.email) {
    try {
      const qrDataUrl = await generateQrDataUrl(ticket.qrCode);
      await sendTicketEmail(
        ticket.user.email,
        ticket.user.name,
        ticket.event.title,
        formatEventDate(ticket.event.date),
        qrDataUrl
      );
    } catch (error) {
      console.error("Erreur envoi email billet:", error);
    }
  }

  return ticket;
}

export async function joinWaitlist(userId: string, eventId: string) {
  const event = await getEventById(eventId);
  if (!event) throw notFound("Événement introuvable ou non publié.");

  if (!isEventSoldOut(event)) {
    throw badRequest("Des places sont encore disponibles. Réservez directement.", "NOT_SOLD_OUT");
  }

  const existingTicket = await getUserTicketForEvent(userId, eventId);
  if (existingTicket) {
    throw badRequest("Vous avez déjà un billet pour cet événement.", "DUPLICATE_TICKET");
  }

  const existingWaitlist = await getUserWaitlistEntry(userId, eventId);
  if (existingWaitlist) {
    throw badRequest("Vous êtes déjà inscrit(e) sur la liste d'attente.", "DUPLICATE_WAITLIST");
  }

  return prisma.waitlistEntry.create({
    data: { userId, eventId },
  });
}

export async function getTicketQrDataUrl(ticketId: string, userId: string) {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, userId },
  });

  if (!ticket) throw notFound("Billet introuvable.");
  if (ticket.status !== "CONFIRMED" && ticket.status !== "SCANNED") {
    throw badRequest("Le QR code n'est disponible que pour les billets confirmés.");
  }

  return generateQrDataUrl(ticket.qrCode);
}
