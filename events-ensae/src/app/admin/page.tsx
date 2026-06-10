// src/app/admin/page.tsx
import Link from "next/link";
import {
  Calendar, Settings, Ticket, Users, Music,
  TrendingUp, Clock, CheckCircle2, AlertCircle,
  Bell,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "./AdminNav";
import styles from "./admin.module.css";
import appStyles from "../app-page.module.css";

export const metadata = {
  title: "Administration | ENSAE Events",
};

export default async function AdminPage() {
  await requireAdmin();

  const [
    eventCount, ticketConfirmed, ticketPending, userCount,
    upcomingCount, pendingMusicCount, pendingReviewCount,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.ticket.count({ where: { status: "CONFIRMED" } }),
    prisma.ticket.count({ where: { status: "PENDING" } }),
    prisma.ticket.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.user.count(),
    prisma.event.count({ where: { published: true, date: { gte: new Date() } } }),
    prisma.musicSuggestion.count({ where: { approved: false } }),
  ]);

  const revenue = await prisma.ticket.findMany({
    where: { status: "CONFIRMED" },
    include: { event: { select: { price: true } } },
  });
  const estimatedRevenue = revenue.reduce((sum, t) => sum + t.event.price, 0);

  /* 5 prochains événements */
  const upcomingEvents = await prisma.event.findMany({
    where: { published: true, date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 5,
    include: { _count: { select: { tickets: { where: { status: "CONFIRMED" } } } } },
  });

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(d));

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <div className="container">
          <div className={styles.pageHeaderInner}>
            <div>
              <div className={styles.eyebrow}>
                <Settings size={13} /> Back-office
              </div>
              <h1 className={styles.pageTitle}>Administration</h1>
              <p className={styles.pageSubtitle}>Vue d&apos;ensemble de la plateforme ENSAE Events.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <AdminNav />

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{eventCount}</div>
            <div className={styles.statLabel}>Événements</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{ticketConfirmed}</div>
            <div className={styles.statLabel}>Billets confirmés</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{ticketPending}</div>
            <div className={styles.statLabel}>En attente paiement</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{estimatedRevenue.toLocaleString("fr-FR")}</div>
            <div className={styles.statLabel}>Revenus estimés (FCFA)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{upcomingCount}</div>
            <div className={styles.statLabel}>Événements à venir</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{userCount}</div>
            <div className={styles.statLabel}>Utilisateurs inscrits</div>
          </div>
        </div>

        {/* Alertes action rapide */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: "16px", marginBottom: "32px" }}>
          {pendingMusicCount > 0 && (
            <div className={styles.alertError} style={{ marginBottom: 0 }}>
              <AlertCircle size={16} />
              <span>
                <strong>{pendingMusicCount} musique{pendingMusicCount > 1 ? "s" : ""}</strong> en attente de modération
                <Link href="/admin/musiques" style={{ marginLeft: 8, textDecoration: "underline", fontWeight: 700 }}>Modérer</Link>
              </span>
            </div>
          )}
          {ticketPending > 0 && (
            <div className={styles.alertSuccess} style={{ marginBottom: 0 }}>
              <CheckCircle2 size={16} />
              <span>
                <strong>{ticketPending} billet{ticketPending > 1 ? "s" : ""}</strong> en attente de paiement
                <Link href="/admin/participants" style={{ marginLeft: 8, textDecoration: "underline", fontWeight: 700 }}>Voir</Link>
              </span>
            </div>
          )}
          {pendingReviewCount > 0 && (
            <div className={styles.alertError} style={{ marginBottom: 0 }}>
              <Bell size={16} />
              <span>
                <strong>{pendingReviewCount} paiement{pendingReviewCount > 1 ? "s" : ""}</strong> à vérifier
                <Link href="/admin/participants" style={{ marginLeft: 8, textDecoration: "underline", fontWeight: 700 }}>
                  Vérifier maintenant
                </Link>
              </span>
            </div>
          )}
        </div>

        {/* Accès rapides */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: "16px", marginBottom: "36px" }}>
          {[
            { href: "/admin/evenements/nouveau", icon: Calendar, label: "Créer un événement", desc: "Publier un nouvel événement" },
            { href: "/admin/participants", icon: Ticket, label: "Gérer les participants", desc: "Billets, présences, export CSV" },
            { href: "/admin/musiques", icon: Music, label: "Modérer les musiques", desc: "Approuver ou refuser les suggestions" },
            { href: "/admin/utilisateurs", icon: Users, label: "Gérer les utilisateurs", desc: "Rôles et accès étudiants" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: "16px",
                padding: "20px 22px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                textDecoration: "none",
                boxShadow: "var(--shadow-sm)",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              className="admin-quick-link"
            >
              <div style={{
                width: 42, height: 42,
                background: "var(--color-primary-50)",
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--color-primary)", flexShrink: 0,
              }}>
                <item.icon size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Prochains événements */}
        {upcomingEvents.length > 0 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={17} color="var(--color-accent)" />
              Prochains événements
            </h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Événement</th>
                    <th>Date</th>
                    <th>Billets</th>
                    <th>Capacité</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingEvents.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <div className={styles.tableName}>{event.title}</div>
                        <div className={styles.tableSub}>{event.location}</div>
                      </td>
                      <td>{formatDate(event.date)}</td>
                      <td>{event._count.tickets}</td>
                      <td>{event.capacity}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <Link href={`/admin/evenements/${event.id}`} className="btn btn-ghost btn-sm">Gérer</Link>
                          <Link href={`/admin/participants/${event.id}`} className="btn btn-ghost btn-sm">Participants</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}