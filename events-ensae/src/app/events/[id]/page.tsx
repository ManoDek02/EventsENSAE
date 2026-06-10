// src/app/events/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Music,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import {
  canRegister,
  EVENT_CATEGORY_LABELS,
  formatEventDate,
  formatEventTime,
  formatPrice,
  getRemainingSeats,
  isAlmostSoldOut,
  isDeadlinePassed,
  isEventSoldOut,
  isFreeEvent,
} from "@/lib/events";
import { getSession } from "@/lib/session";
import { getUserWaitlistEntry } from "@/lib/tickets";
import { EventBookingActions } from "@/components/events/EventBookingActions";
import { prisma } from "@/lib/prisma";
import styles from "../events.module.css";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id, published: true },
    select: { title: true },
  });
  return {
    title: event ? `${event.title} | ENSAE Events` : "Événement | ENSAE Events",
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  /* ─── Récupérer l'événement avec ticketTypes ──────────────── */
  const rawEvent = await prisma.event.findUnique({
    where: { id, published: true },
    include: {
      _count: {
        select: { tickets: { where: { status: "CONFIRMED" } } },
      },
      ticketTypes: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!rawEvent) notFound();

  /* ─── Enrichir avec les helpers existants ────────────────── */
  const event = {
    ...rawEvent,
    _count: rawEvent._count,
  };

  const remainingSeats = getRemainingSeats(event);
  const soldTickets = event.capacity - remainingSeats;
  const progress = Math.min(Math.round((soldTickets / event.capacity) * 100), 100);
  const isSoldOut = isEventSoldOut(event);
  const almostSoldOut = isAlmostSoldOut(event);
  const deadlinePassed = isDeadlinePassed(event);
  const registrationOpen = canRegister(event);

  /* ─── Session et billet existant ────────────────────────── */
  const session = await getSession();
  const userId = session?.user?.id;

  const existingTicket = userId
    ? await prisma.ticket.findFirst({
      where: {
        userId,
        eventId: id,
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        status: true,
        qrCode: true,
        ticketType: { select: { name: true } },
      },
    })
    : null;

  const waitlistEntry = userId ? await getUserWaitlistEntry(userId, id) : null;

  /* ─── Types de billets pour l'affichage ──────────────────── */
  const ticketTypes = event.ticketTypes ?? [];
  const hasTicketTypes = ticketTypes.length > 0;

  return (
    <main>
      <section className={styles.detailHero}>
        {event.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className={styles.detailImage} />
        )}
        <div className={styles.detailOverlay} />
        <div className="container">
          <div className={styles.detailContent}>
            <Link href="/events" className={styles.backLink}>
              <ArrowLeft size={17} />
              Retour aux événements
            </Link>
            <div className={styles.detailBadge}>
              <Sparkles size={15} />
              {EVENT_CATEGORY_LABELS[event.category] ?? "Événement"}
            </div>
            <h1 className={styles.detailTitle}>{event.title}</h1>
            <p className={styles.detailLead}>{event.description}</p>
          </div>
        </div>
      </section>

      <section className={styles.detailMain}>
        <div className="container">
          <div className={styles.detailGrid}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Détails de l&apos;événement</h2>
              <p className={styles.bodyText}>{event.description}</p>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}><Calendar size={17} /></span>
                  <span>{formatEventDate(event.date)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}><Clock size={17} /></span>
                  <span>{formatEventTime(event.date)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}><MapPin size={17} /></span>
                  <span>{event.location}</span>
                </div>
                {event.allowsMusicSuggestions && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}><Music size={17} /></span>
                    <span>Playlist communautaire liée à cet événement</span>
                  </div>
                )}
              </div>

              {event.tags.length > 0 && (
                <div className={styles.tags}>
                  {event.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <aside className={styles.sidePanel}>

              {/* ─── Prix : types ou prix unique ───────────── */}
              {hasTicketTypes ? (
                <div style={{ marginBottom: "8px" }}>
                  {ticketTypes.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        padding: "5px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span style={{ color: "var(--text-secondary)" }}>{t.name}</span>
                      <span style={{ fontWeight: 700, color: "var(--color-primary)", marginLeft: 12 }}>
                        {t.price === 0 ? "Gratuit" : `${t.price.toLocaleString("fr-FR")} FCFA`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className={styles.sidePrice}>{formatPrice(event.price)}</div>
                  {isFreeEvent(event) && (
                    <span className={styles.sideBadgeFree}>Événement gratuit</span>
                  )}
                </>
              )}

              {/* ─── Jauge places ──────────────────────────── */}
              <div className={styles.sideMeta}>
                <div className={styles.seats}>
                  <Users size={16} />
                  {soldTickets} inscrits sur {event.capacity}
                </div>
                <div className={styles.progress} aria-hidden="true">
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <div
                  className={styles.seats}
                  style={
                    isSoldOut
                      ? { color: "var(--color-error)" }
                      : almostSoldOut
                        ? { color: "var(--color-warning)" }
                        : {}
                  }
                >
                  <Ticket size={16} />
                  {isSoldOut
                    ? "Complet"
                    : almostSoldOut
                      ? `Bientôt complet — ${remainingSeats} places restantes`
                      : `${remainingSeats} places restantes`}
                </div>
              </div>

              {/* ─── Booking actions ───────────────────────── */}
              <EventBookingActions
                eventId={event.id}
                isLoggedIn={!!session}
                loginHref={`/auth/login?callbackUrl=/events/${event.id}`}
                deadlinePassed={isDeadlinePassed(event)}
                isSoldOut={isEventSoldOut(event)}
                registrationOpen={registrationOpen}
                isFree={isFreeEvent(event)}
                price={event.price}
                eventTitle={event.title}
                userName={session?.user?.name ?? ""}
                existingTicketStatus={existingTicket?.status ?? null}
                existingTicketId={existingTicket?.id ?? null}
                existingTicketCode={existingTicket?.qrCode ?? null}
                existingTicketTypeName={existingTicket?.ticketType?.name ?? null}
                onWaitlist={!!waitlistEntry}
                ticketTypes={ticketTypes.map((t) => ({
                  id: t.id,
                  name: t.name,
                  description: t.description,
                  price: t.price,
                }))}
              />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}