import Link from "next/link";
import styles from "./page.module.css";
import {
  Calendar,
  MapPin,
  Ticket,
  Music,
  Trophy,
  GlassWater,
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  Camera,
  LucideIcon,
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
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date));

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroBgGradient} />
          <div className={styles.heroBgGrid} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} className={styles.heroBadgeIcon} />
            <span>Plateforme Officielle ENSAE Dakar</span>
          </div>

          <h1 className={styles.heroTitle}>
            Gérez et participez aux{" "}
            <span className={styles.heroTitleGradient}>événements</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Billetterie dématérialisée, votes musicaux communautaires et gestion simplifiée.
            La plateforme pensée pour les étudiants de l&apos;ENSAE Dakar.
          </p>

          <div className={styles.heroActions}>
            <Link href="/events" className="btn btn-primary btn-lg">
              Voir les événements
              <ArrowRight size={18} />
            </Link>
            <Link href="/auth/register" className="btn btn-secondary btn-lg">
              Créer un compte
            </Link>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>3+</span>
              <span className={styles.heroStatLabel}>Catégories</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>100%</span>
              <span className={styles.heroStatLabel}>Numérique</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>
                <ShieldCheck size={28} />
              </span>
              <span className={styles.heroStatLabel}>Sécurisé</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Événements récents ───────────────────────────────── */}
      <section className={styles.eventsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <div className="section-tag">
                <Calendar size={14} /> Agenda
              </div>
              <h2 className="section-title">Prochains Événements</h2>
              <p className="section-subtitle">
                Découvrez les événements à venir et réservez votre place dès maintenant.
              </p>
            </div>
            <Link href="/events" className="btn btn-secondary">
              Tout voir
              <ArrowRight size={16} />
            </Link>
          </div>

          {events.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                color: "var(--text-muted)",
              }}
            >
              <Calendar size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
              <p>Aucun événement à venir pour le moment.</p>
              <p style={{ fontSize: "0.85rem", marginTop: "8px" }}>
                Revenez bientôt.
              </p>
            </div>
          ) : (
            <div className="grid-events">
              {events.map((event) => {
                const remainingSeats = getRemainingSeats(event);
                const isSoldOut = isEventSoldOut(event);
                const isLowSeats = isAlmostSoldOut(event);

                const Icon = CATEGORY_ICON[event.category] || Sparkles;

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className={styles.eventCard}
                  >
                    <div className={styles.eventImageWrapper}>
                      <Icon size={48} className={styles.eventIconPlaceholder} />
                      <div className={styles.eventBadgeTop}>
                        <span className={styles.eventBadge}>
                          {EVENT_CATEGORY_LABELS[event.category] ?? "Événement"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.eventBody}>
                      <div className={styles.eventDate}>
                        <Calendar size={14} /> {formatDate(event.date)}
                      </div>
                      <div className={styles.eventTitle}>{event.title}</div>
                      <div className={styles.eventLocation}>
                        <MapPin size={14} /> {event.location}
                      </div>
                    </div>

                    <div className={styles.eventFooter}>
                      <span className={styles.eventPrice}>{formatPrice(event.price)}</span>
                      <span
                        className={styles.eventSeats}
                        style={isLowSeats ? { color: "#fbbf24" } : isSoldOut ? { color: "#ef4444" } : {}}
                      >
                        <Ticket size={14} />
                        {isSoldOut
                          ? "Complet"
                          : isLowSeats
                          ? `${remainingSeats} places restantes`
                          : `${remainingSeats} places`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Souvenirs des événements ─────────────────────────── */}
      <section className={styles.gallerySection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <div className="section-tag">
                <Camera size={14} /> Galerie
              </div>
              <h2 className="section-title">Souvenirs Récents</h2>
              <p className="section-subtitle">
                Revivez les meilleurs moments des événements passés de l&apos;ENSAE.
              </p>
            </div>
          </div>

          <div className={styles.galleryGrid}>
            <div className={styles.galleryItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=1200&q=80" alt="Gala" className={styles.galleryImage} />
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryText}>Dîner de Gala 2024</span>
              </div>
            </div>
            <div className={styles.galleryItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=800&q=80" alt="Football" className={styles.galleryImage} />
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryText}>Championnat Inter-Classe</span>
              </div>
            </div>
            <div className={styles.galleryItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1523580494112-071d16940a43?auto=format&fit=crop&w=800&q=80" alt="Remise de diplomes" className={styles.galleryImage} />
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryText}>Remise des Diplômes</span>
              </div>
            </div>
            <div className={styles.galleryItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80" alt="Conference" className={styles.galleryImage} />
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryText}>Conférence Alumni</span>
              </div>
            </div>
            <div className={styles.galleryItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1574958269340-fa927503f3dd?auto=format&fit=crop&w=1200&q=80" alt="Sortie pedagogique" className={styles.galleryImage} />
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryText}>Sortie Pédagogique — Gorée</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Fonctionnalités ──────────────────────────────────── */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div className="section-tag">
              <Sparkles size={14} /> Fonctionnalités
            </div>
            <h2 className="section-title">Tout pour vivre l&apos;événement</h2>
            <p
              className="section-subtitle"
              style={{ margin: "0 auto" }}
            >
              Une plateforme complète pensée pour la communauté de l&apos;ENSAE Dakar.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {[
              {
                icon: Ticket,
                title: "Billetterie en ligne",
                desc: "Achetez vos billets en quelques clics avec Wave ou Orange Money. Recevez un QR Code unique sécurisé.",
              },
              {
                icon: Music,
                title: "Playlist communautaire",
                desc: "Proposez vos musiques préférées, votez pour celles des autres et découvrez la playlist finale.",
              },
              {
                icon: Trophy,
                title: "Championnats sportifs",
                desc: "Suivez les classements, achetez vos billets et soutenez votre classe lors des tournois inter-promotions.",
              },
              {
                icon: GlassWater,
                title: "Dîner de Gala",
                desc: "Vivez la grande soirée annuelle de l'ENSAE. Billets numériques et surprises au programme.",
              },
            ].map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <f.icon size={24} />
                </div>
                <div className={styles.featureTitle}>{f.title}</div>
                <div className={styles.featureDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>
            Prêt(e) à rejoindre la communauté ?
          </h2>
          <p className={styles.ctaSubtitle}>
            Inscrivez-vous gratuitement avec votre email ENSAE et accédez à tous les
            événements, billets numériques et votes musicaux.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/auth/register" className="btn btn-primary btn-lg">
              S&apos;inscrire maintenant
              <ArrowRight size={18} />
            </Link>
            <Link href="/events" className="btn btn-secondary btn-lg">
              Explorer les événements
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <Sparkles size={16} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>ENSAE Events</span>
          </div>
          <span className={styles.footerCopy}>
            © {new Date().getFullYear()} ENSAE Dakar
          </span>
          <div className={styles.footerLinks}>
            <Link href="/events" className={styles.footerLink}>
              Événements
            </Link>
            <Link href="/auth/login" className={styles.footerLink}>
              Connexion
            </Link>
            <Link href="/auth/register" className={styles.footerLink}>
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
