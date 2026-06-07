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
  getEventById,
  getRemainingSeats,
  isAlmostSoldOut,
  isDeadlinePassed,
  isEventSoldOut,
  isFreeEvent,
} from "@/lib/events";
import { getSession } from "@/lib/session";
import { getUserTicketForEvent, getUserWaitlistEntry } from "@/lib/tickets";
import { EventBookingActions } from "@/components/events/EventBookingActions";
import styles from "../events.module.css";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  return {
    title: event ? `${event.title} | ENSAE Events` : "Événement | ENSAE Events",
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  const remainingSeats = getRemainingSeats(event);
  const soldTickets = event.capacity - remainingSeats;
  const progress = Math.min(Math.round((soldTickets / event.capacity) * 100), 100);
  const isSoldOut = isEventSoldOut(event);
  const almostSoldOut = isAlmostSoldOut(event);
  const deadlinePassed = isDeadlinePassed(event);
  const registrationOpen = canRegister(event);
  const loginHref = `/auth/login?callbackUrl=${encodeURIComponent(`/events/${id}`)}`;

  const session = await getSession();
  const userId = session?.user?.id;
  const existingTicket = userId ? await getUserTicketForEvent(userId, id) : null;
  const waitlistEntry = userId ? await getUserWaitlistEntry(userId, id) : null;

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
                  <span className={styles.infoIcon}>
                    <Calendar size={17} />
                  </span>
                  <span>{formatEventDate(event.date)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>
                    <Clock size={17} />
                  </span>
                  <span>{formatEventTime(event.date)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>
                    <MapPin size={17} />
                  </span>
                  <span>{event.location}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>
                    <Music size={17} />
                  </span>
                  <span>Playlist communautaire liée à cet événement</span>
                </div>
              </div>

              {event.tags.length > 0 && (
                <div className={styles.tags}>
                  {event.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <aside className={styles.sidePanel}>
              <div className={styles.sidePrice}>{formatPrice(event.price)}</div>
              {isFreeEvent(event) && (
                <span className={styles.sideBadgeFree}>Événement gratuit</span>
              )}
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
                      ? { color: "#9B2626" }
                      : almostSoldOut
                        ? { color: "#B8861A" }
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

              <EventBookingActions
                eventId={id}
                isLoggedIn={!!userId}
                loginHref={loginHref}
                deadlinePassed={deadlinePassed}
                isSoldOut={isSoldOut}
                registrationOpen={registrationOpen}
                isFree={isFreeEvent(event)}
                existingTicketStatus={existingTicket?.status ?? null}
                onWaitlist={!!waitlistEntry}
              />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
