import { prisma } from "@/lib/prisma";

export type EventWithCount = {
  id: string;
  title: string;
  description: string;
  category: string;
  date: Date;
  location: string;
  imageUrl: string | null;
  price: number;
  capacity: number;
  deadline: Date | null;
  published: boolean;
  tags: string[];
  _count: { tickets: number };
  occupiedSeats?: number; // ← places réelles occupées (seats inclus)
};

export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  SORTIE_PEDAGOGIQUE: "Sortie pédagogique",
  CHAMPIONNAT: "Championnat",
  GALA: "Dîner de gala",
  CONFERENCE: "Conférence",
  AUTRE: "Événement",
};

export const EVENT_CATEGORY_OPTIONS = Object.entries(EVENT_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

const CONFIRMED_TICKETS_COUNT = {
  _count: { select: { tickets: { where: { status: "CONFIRMED" as const } } } },
} as const;

/* ─── Calcule les places réellement occupées (sum des seats) ── */
export async function getOccupiedSeats(eventId: string): Promise<number> {
  const tickets = await prisma.ticket.findMany({
    where: {
      eventId,
      status: { in: ["CONFIRMED", "PENDING", "PENDING_REVIEW"] },
    },
    include: { ticketType: { select: { seats: true } } },
  });

  return tickets.reduce((sum, t) => sum + (t.ticketType?.seats ?? 1), 0);
}

/* ─── Version batch pour plusieurs événements ──────────────── */
export async function getOccupiedSeatsBatch(
  eventIds: string[]
): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};

  const tickets = await prisma.ticket.findMany({
    where: {
      eventId: { in: eventIds },
      status: { in: ["CONFIRMED", "PENDING", "PENDING_REVIEW"] },
    },
    include: { ticketType: { select: { seats: true } } },
  });

  const result: Record<string, number> = {};
  for (const id of eventIds) result[id] = 0;
  for (const t of tickets) {
    result[t.eventId] = (result[t.eventId] ?? 0) + (t.ticketType?.seats ?? 1);
  }
  return result;
}

export async function getPublishedEvents(): Promise<EventWithCount[]> {
  try {
    const events = await prisma.event.findMany({
      where: { published: true, date: { gte: new Date() } },
      orderBy: { date: "asc" },
      include: CONFIRMED_TICKETS_COUNT,
    });

    if (events.length === 0) return [];

    // Enrichir avec les places réelles en une seule requête batch
    const occupiedMap = await getOccupiedSeatsBatch(events.map((e) => e.id));

    return events.map((e) => ({ ...e, occupiedSeats: occupiedMap[e.id] ?? 0 }));
  } catch {
    return [];
  }
}

export async function getEventById(id: string): Promise<EventWithCount | null> {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: CONFIRMED_TICKETS_COUNT,
    });

    if (!event?.published) return null;

    const occupiedSeats = await getOccupiedSeats(id);
    return { ...event, occupiedSeats };
  } catch {
    return null;
  }
}

export function filterEvents(
  events: EventWithCount[],
  query?: string,
  category?: string
) {
  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const normalizedCategory = category?.trim() ?? "";

  return events.filter((event) => {
    const matchesCategory = !normalizedCategory || event.category === normalizedCategory;
    const searchable = [
      event.title,
      event.description,
      event.location,
      EVENT_CATEGORY_LABELS[event.category],
      ...event.tags,
    ]
      .join(" ")
      .toLowerCase();

    return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

/* ─── getRemainingSeats — utilise occupiedSeats si disponible ── */
export function getRemainingSeats(event: EventWithCount) {
  const occupied = event.occupiedSeats ?? event._count.tickets;
  return Math.max(event.capacity - occupied, 0);
}

export function isEventSoldOut(event: EventWithCount) {
  return getRemainingSeats(event) === 0;
}

export function isAlmostSoldOut(event: EventWithCount, threshold = 10) {
  const remaining = getRemainingSeats(event);
  return remaining > 0 && remaining <= threshold;
}

export function isDeadlinePassed(event: EventWithCount) {
  if (!event.deadline) return false;
  return new Date(event.deadline) < new Date();
}

export function isFreeEvent(event: EventWithCount) {
  return event.price === 0;
}

export function canRegister(event: EventWithCount) {
  return !isEventSoldOut(event) && !isDeadlinePassed(event);
}

export function serializeEvent(event: EventWithCount) {
  const remainingSeats = getRemainingSeats(event);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    categoryLabel: EVENT_CATEGORY_LABELS[event.category] ?? "Événement",
    date: event.date.toISOString(),
    location: event.location,
    imageUrl: event.imageUrl,
    price: event.price,
    priceLabel: formatPrice(event.price),
    capacity: event.capacity,
    confirmedTickets: event._count.tickets,
    remainingSeats,
    deadline: event.deadline?.toISOString() ?? null,
    published: event.published,
    tags: event.tags,
    isFree: isFreeEvent(event),
    isSoldOut: remainingSeats === 0,
    isAlmostSoldOut: isAlmostSoldOut(event),
    isDeadlinePassed: isDeadlinePassed(event),
    canRegister: canRegister(event),
  };
}

export function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatEventTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatPrice(price: number) {
  return price === 0 ? "Gratuit" : `${price.toLocaleString("fr-FR")} FCFA`;
}