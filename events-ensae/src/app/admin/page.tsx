import Link from "next/link";
import { Calendar, Settings, Ticket, Users } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import styles from "../app-page.module.css";

export const metadata = {
  title: "Administration | ENSAE Events",
};

export default async function AdminPage() {
  await requireAdmin();

  const [eventCount, ticketCount, userCount, upcomingCount] = await Promise.all([
    prisma.event.count(),
    prisma.ticket.count({ where: { status: "CONFIRMED" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.event.count({
      where: { published: true, date: { gte: new Date() } },
    }),
  ]);

  const revenue = await prisma.ticket.findMany({
    where: { status: "CONFIRMED" },
    include: { event: { select: { price: true } } },
  });

  const estimatedRevenue = revenue.reduce((sum, ticket) => sum + ticket.event.price, 0);

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className="container">
          <div className={styles.eyebrow}>
            <Settings size={15} />
            Back-office
          </div>
          <h1 className={styles.title}>Administration</h1>
          <p className={styles.subtitle}>
            Vue d&apos;ensemble de la plateforme événementielle ENSAE Dakar.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{eventCount}</div>
              <div className={styles.statLabel}>Événements</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{ticketCount}</div>
              <div className={styles.statLabel}>Billets confirmés</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {estimatedRevenue.toLocaleString("fr-FR")}
              </div>
              <div className={styles.statLabel}>Revenus estimés (FCFA)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{upcomingCount}</div>
              <div className={styles.statLabel}>Événements à venir</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{userCount}</div>
              <div className={styles.statLabel}>Étudiants inscrits</div>
            </div>
          </div>

          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Settings size={28} />
            </div>
            <h2 className={styles.emptyTitle}>Outils admin en cours de développement</h2>
            <p className={styles.emptyText}>
              La gestion des événements, participants, musiques et utilisateurs sera disponible
              dans les prochaines étapes.
            </p>
            <div className={styles.actions} style={{ justifyContent: "center" }}>
              <Link href="/events" className="btn btn-secondary">
                <Calendar size={16} />
                Voir les événements
              </Link>
              <button className="btn btn-secondary" disabled>
                <Users size={16} />
                Gérer les participants
              </button>
              <button className="btn btn-secondary" disabled>
                <Ticket size={16} />
                Scanner QR
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
