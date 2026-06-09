import Link from "next/link";
import { CheckCircle2, ChevronRight, Clock, History, Music, Ticket } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import styles from "./profile.module.css";

export const metadata = { title: "Mon Profil | ENSAE Events" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [confirmedTickets, pastEvents, musicCount, votesCount] = await Promise.all([
    prisma.ticket.count({
      where: { userId: user.id, status: "CONFIRMED" },
    }),
    prisma.ticket.count({
      where: {
        userId: user.id,
        status: { in: ["CONFIRMED", "SCANNED"] },
        event: { date: { lt: new Date() } },
      },
    }),
    prisma.musicSuggestion.count({ where: { userId: user.id } }),
    prisma.vote.count({ where: { userId: user.id } }),
  ]);

  const initials = user.name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(user.createdAt));

  return (
    <div>
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.avatar}>{initials}</div>

            <div className={styles.heroInfo}>
              <h1 className={styles.heroName}>{user.name}</h1>
              <p className={styles.heroEmail}>{user.email}</p>
              <div className={styles.heroBadges}>
                {user.emailVerified ? (
                  <span className={styles.badgeVerified}>
                    <CheckCircle2 size={11} /> Email vérifié
                  </span>
                ) : (
                  <span className={styles.badgePending}>
                    <Clock size={11} /> Email non vérifié
                  </span>
                )}
                {user.filiere && (
                  <span className={styles.badgeMeta}>{user.filiere}</span>
                )}
                {user.promotion && (
                  <span className={styles.badgeMeta}>{user.promotion}</span>
                )}
                <span className={styles.badgeMeta}>
                  Membre depuis {memberSince}
                </span>
              </div>
            </div>

            <div className={styles.heroEditBtn}>
              <Link href="/profile/modifier" className="btn btn-secondary btn-sm">
                Modifier
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────── */}
      <section className={styles.statsBar}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{confirmedTickets}</span>
              <span className={styles.statLabel}>Billets confirmés</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{pastEvents}</span>
              <span className={styles.statLabel}>Événements passés</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{musicCount}</span>
              <span className={styles.statLabel}>Musiques proposées</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{votesCount}</span>
              <span className={styles.statLabel}>Votes effectués</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contenu ───────────────────────────────────────── */}
      <section className={styles.content}>
        <div className="container">

          {/* Infos du compte */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoCardLabel}>Nom complet</div>
              <div className={styles.infoCardValue}>{user.name}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoCardLabel}>Email</div>
              <div className={styles.infoCardValue}>{user.email}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoCardLabel}>Filière</div>
              <div className={styles.infoCardValue}>
                {user.filiere ?? <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Non renseignée</span>}
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoCardLabel}>Promotion</div>
              <div className={styles.infoCardValue}>
                {user.promotion ?? <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Non renseignée</span>}
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoCardLabel}>Rôle</div>
              <div className={styles.infoCardValue}>
                {user.role === "ADMIN" ? "Administrateur" : "Étudiant"}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className={styles.navGrid}>
            <Link href="/profile/tickets" className={styles.navCard}>
              <div className={styles.navCardIcon}>
                <Ticket size={20} />
              </div>
              <div className={styles.navCardBody}>
                <div className={styles.navCardTitle}>Mes Billets</div>
                <div className={styles.navCardDesc}>
                  {confirmedTickets} billet{confirmedTickets !== 1 ? "s" : ""} confirmé{confirmedTickets !== 1 ? "s" : ""}
                </div>
              </div>
              <ChevronRight size={18} className={styles.navCardArrow} />
            </Link>

            <Link href="/profile/historique" className={styles.navCard}>
              <div className={styles.navCardIcon}>
                <History size={20} />
              </div>
              <div className={styles.navCardBody}>
                <div className={styles.navCardTitle}>Historique</div>
                <div className={styles.navCardDesc}>
                  Événements passés, musiques, votes
                </div>
              </div>
              <ChevronRight size={18} className={styles.navCardArrow} />
            </Link>

            <Link href="/music" className={styles.navCard}>
              <div className={styles.navCardIcon}>
                <Music size={20} />
              </div>
              <div className={styles.navCardBody}>
                <div className={styles.navCardTitle}>Playlist communautaire</div>
                <div className={styles.navCardDesc}>
                  Proposer des musiques et voter
                </div>
              </div>
              <ChevronRight size={18} className={styles.navCardArrow} />
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}