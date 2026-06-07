import Link from "next/link";
import {
  Calendar,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  Trophy,
  Users,
  GlassWater,
  LucideIcon,
} from "lucide-react";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_OPTIONS,
  EventWithCount,
  filterEvents,
  formatEventDate,
  formatPrice,
  getPublishedEvents,
  getRemainingSeats,
  isAlmostSoldOut,
  isEventSoldOut,
  isFreeEvent,
} from "@/lib/events";
import styles from "./events.module.css";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  SORTIE_PEDAGOGIQUE: MapPin,
  CHAMPIONNAT: Trophy,
  GALA: GlassWater,
  CONFERENCE: Users,
  AUTRE: Sparkles,
};

type EventsPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
  }>;
};


function EventCard({ event }: { event: EventWithCount }) {
  const remainingSeats = getRemainingSeats(event);
  const soldOut = isEventSoldOut(event);
  const lowSeats = isAlmostSoldOut(event);
  const free = isFreeEvent(event);
  const Icon = CATEGORY_ICONS[event.category] ?? Sparkles;

  return (
    <Link href={`/events/${event.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {event.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className={styles.image} />
        )}
        <span className={styles.categoryBadge}>
          <Icon size={14} />
          {EVENT_CATEGORY_LABELS[event.category] ?? "Événement"}
        </span>
        <span
          className={styles.priceBadge}
          style={free ? { background: "rgba(31, 107, 71, 0.9)" } : undefined}
        >
          {free ? "Gratuit" : "Payant"}
        </span>
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <Calendar size={15} />
          {formatEventDate(event.date)}
        </div>
        <h2 className={styles.cardTitle}>{event.title}</h2>
        <p className={styles.description}>{event.description}</p>
        <div className={styles.location}>
          <MapPin size={15} />
          {event.location}
        </div>
      </div>
      <div className={styles.footer}>
        <span className={styles.price}>{formatPrice(event.price)}</span>
        <span
          className={styles.seats}
          style={lowSeats ? { color: "#B8861A" } : soldOut ? { color: "#9B2626" } : {}}
        >
          <Ticket size={15} />
          {soldOut ? "Complet" : lowSeats ? `Bientôt complet (${remainingSeats})` : `${remainingSeats} places`}
        </span>
      </div>
    </Link>
  );
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const category = params?.category ?? "";
  const events = await getPublishedEvents();
  const filteredEvents = filterEvents(events, query, category);
  const availableSeats = events.reduce((total, event) => total + getRemainingSeats(event), 0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerGrid}>
            <div>
              <div className={styles.eyebrow}>
                <Sparkles size={15} />
                Agenda ENSAE Dakar
              </div>
              <h1 className={styles.title}>Événements</h1>
              <p className={styles.subtitle}>
                Retrouvez les sorties pédagogiques, conférences, championnats et soirées publiés
                par le club.
              </p>
            </div>
            <div className={styles.summary} aria-label="Résumé des événements">
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{events.length}</span>
                <span className={styles.summaryLabel}>à venir</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{availableSeats}</span>
                <span className={styles.summaryLabel}>places</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="container">
        <form className={styles.toolbar} action="/events">
          <div className={styles.inputWrap}>
            <Search size={17} className={styles.inputIcon} />
            <input
              className={`form-input ${styles.searchInput}`}
              type="search"
              name="q"
              placeholder="Rechercher un événement"
              defaultValue={query}
            />
          </div>
          <select className="form-input" name="category" defaultValue={category}>
            <option value="">Toutes les catégories</option>
            {EVENT_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">
            <SlidersHorizontal size={16} />
            Filtrer
          </button>
        </form>

        {filteredEvents.length > 0 ? (
          <div className={styles.grid}>
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Calendar size={24} />
            </div>
            <h2 className={styles.panelTitle}>Aucun événement publié</h2>
            <p className={styles.bodyText}>
              Revenez bientôt : de nouveaux événements seront annoncés par le club.
            </p>
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Calendar size={24} />
            </div>
            <h2 className={styles.panelTitle}>Aucun événement trouvé</h2>
            <p className={styles.bodyText}>
              Essayez une autre recherche ou retirez le filtre de catégorie.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
