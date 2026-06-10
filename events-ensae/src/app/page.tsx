export const revalidate = 0;

// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import {
  Calendar, MapPin, Ticket, Music, Trophy,
  GlassWater, ArrowRight, Users, ShieldCheck,
  QrCode, Sparkles, LucideIcon,
} from "lucide-react";
import {
  EVENT_CATEGORY_LABELS,
  formatPrice,
  getPublishedEvents,
  getRemainingSeats,
  isAlmostSoldOut,
  isEventSoldOut,
} from "@/lib/events";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  SORTIE_PEDAGOGIQUE: MapPin,
  CHAMPIONNAT: Trophy,
  GALA: GlassWater,
  CONFERENCE: Users,
  AUTRE: Sparkles,
};

async function getRecentEvents() {
  const events = await getPublishedEvents();
  return events.slice(0, 6);
}

export default async function HomePage() {
  const events = await getRecentEvents();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    }).format(new Date(date));

  return (
    <>
      {/* ─── Hero split ───────────────────────────────────────── */}
      <section className={styles.hero}>

        {/* Gauche — contenu */}
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot}>
              <Sparkles size={11} color="white" />
            </span>
            Plateforme Officielle ENSAE Dakar
          </div>

          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleLine}>Vivez les</span>
            <span className={styles.heroTitleAccent}>événements ENSAE</span>
            <span className={styles.heroTitleLine}>différemment.</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Réservez vos billets, votez pour la playlist, suivez les championnats.
            La plateforme pensée pour la communauté étudiante de l&apos;ENSAE Dakar.
          </p>

          <div className={styles.heroActions}>
            <Link href="/events" className="btn btn-primary btn-lg">
              Voir les événements
              <ArrowRight size={17} />
            </Link>
            <Link href="/auth/register" className="btn btn-secondary btn-lg">
              Créer un compte
            </Link>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{events.length}+</span>
              <span className={styles.heroStatLabel}>Événements</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>100%</span>
              <span className={styles.heroStatLabel}>Numérique</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}><ShieldCheck size={22} /></span>
              <span className={styles.heroStatLabel}>Sécurisé</span>
            </div>
          </div>
        </div>

        {/* Droite — image */}
        <div className={styles.heroRight}>
          <Image
            src="/hero-ensae.jpg"
            alt="Campus ENSAE Dakar"
            fill
            className={styles.heroImage}
            priority
            sizes="50vw"
          />
          <div className={styles.heroImageOverlay} />
        </div>
      </section>

      {/* ─── Événements récents ────────────────────────────────── */}
      <section className={styles.eventsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <div className="section-tag">
                <Calendar size={13} /> Agenda
              </div>
              <h2 className="section-title">Prochains Événements</h2>
              <p className="section-subtitle">
                Découvrez les événements à venir et réservez votre place dès maintenant.
              </p>
            </div>
            <Link href="/events" className="btn btn-secondary">
              Tout voir <ArrowRight size={15} />
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Calendar size={28} /></div>
              <p className="empty-state-title">Aucun événement à venir</p>
              <p className="empty-state-text">Revenez bientôt, de nouveaux événements seront publiés prochainement.</p>
            </div>
          ) : (
            <div className="grid-events">
              {events.map((event) => {
                const Icon = CATEGORY_ICON[event.category] ?? Sparkles;
                const soldOut = isEventSoldOut(event);
                const almostSoldOut = isAlmostSoldOut(event);
                const remaining = getRemainingSeats(event);

                return (
                  <Link key={event.id} href={`/events/${event.id}`} className={styles.eventCard}>
                    <div className={styles.eventImageWrapper}>
                      {event.imageUrl ? (
                        <Image src={event.imageUrl} alt={event.title} fill className={styles.heroImage} sizes="(max-width: 768px) 100vw, 33vw" />
                      ) : (
                        <div className={styles.eventIconPlaceholder}>
                          <Icon size={48} strokeWidth={1.5} />
                        </div>
                      )}
                      <div className={styles.eventBadgeTop}>
                        <span className={styles.eventBadge}>
                          {EVENT_CATEGORY_LABELS[event.category] ?? "Événement"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.eventBody}>
                      <div className={styles.eventDate}>
                        <Calendar size={13} /> {formatDate(event.date)}
                      </div>
                      <h3 className={styles.eventTitle}>{event.title}</h3>
                      <p className={styles.eventLocation}>
                        <MapPin size={13} /> {event.location}
                      </p>
                    </div>

                    <div className={styles.eventFooter}>
                      <span className={event.price === 0 ? styles.eventPriceFree : styles.eventPrice}>
                        {event.price === 0 ? "Gratuit" : formatPrice(event.price)}
                      </span>
                      <span className={`${styles.eventSeats} ${soldOut ? styles.eventSeatsCritical : almostSoldOut ? styles.eventSeatsLow : ""}`}>
                        <Users size={13} />
                        {soldOut ? "Complet" : almostSoldOut ? `${remaining} places` : `${remaining} places`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────── */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className={styles.featuresSectionInner}>
            <h2 className={styles.featuresSectionTitle}>
              Tout ce dont vous avez besoin<br />
              <span>pour vivre les événements ENSAE.</span>
            </h2>

            <div className={styles.featuresGrid}>
              {[
                { icon: Ticket, title: "Billetterie numérique", desc: "Réservez en ligne, recevez votre QR code par email, accédez en un scan." },
                { icon: Music, title: "Playlist communautaire", desc: "Proposez des musiques, votez pour vos favoris, constituez la playlist de la soirée." },
                { icon: Trophy, title: "Championnats", desc: "Suivez les classements, les résultats et les phases de groupe inter-classe." },
                { icon: QrCode, title: "Contrôle d'accès", desc: "Validation instantanée des billets à l'entrée via scanner QR intégré." },
                { icon: ShieldCheck, title: "Paiement sécurisé", desc: "Wave et Orange Money intégrés, confirmation automatique par email." },
                { icon: Users, title: "Espace étudiant", desc: "Profil, historique des billets, suggestions musicales et votes au même endroit." },
              ].map((f) => (
                <div key={f.title} className={styles.featureItem}>
                  <div className={styles.featureIcon}><f.icon size={20} /></div>
                  <div className={styles.featureTitle}>{f.title}</div>
                  <div className={styles.featureDesc}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA final ─────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Prêt à rejoindre la communauté ?</h2>
          <p className={styles.ctaSubtitle}>
            Créez votre compte en 30 secondes et accédez à tous les événements de l&apos;ENSAE Dakar.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/auth/register" className="btn btn-primary btn-lg">
              S&apos;inscrire gratuitement <ArrowRight size={17} />
            </Link>
            <Link href="/events" className="btn btn-secondary btn-lg">
              Parcourir les événements
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}