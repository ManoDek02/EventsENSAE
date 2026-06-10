// src/app/admin/participants/page.tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "../AdminNav";
import styles from "../admin.module.css";
import { Ticket, Users } from "lucide-react";

export const metadata = { title: "Participants | Admin ENSAE" };

export default async function ParticipantsIndexPage() {
    await requireAdmin();

    const events = await prisma.event.findMany({
        orderBy: { date: "desc" },
        include: {
            _count: {
                select: {
                    tickets: { where: { status: "CONFIRMED" } },
                    waitlistEntries: true,
                },
            },
        },
    });

    const formatDate = (d: Date) =>
        new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <div className={styles.eyebrow}><Users size={13} /> Gestion</div>
                    <h1 className={styles.pageTitle}>Participants</h1>
                    <p className={styles.pageSubtitle}>Sélectionnez un événement pour gérer ses inscrits.</p>
                </div>
            </div>
            <div className="container">
                <AdminNav />
                {events.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}><Ticket size={24} /></div>
                        <p className={styles.emptyText}>Aucun événement créé.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Événement</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                    <th>Billets confirmés</th>
                                    <th>Liste d&apos;attente</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr key={event.id}>
                                        <td>
                                            <div className={styles.tableName}>{event.title}</div>
                                            <div className={styles.tableSub}>{event.location}</div>
                                        </td>
                                        <td style={{ fontSize: "0.85rem" }}>{formatDate(event.date)}</td>
                                        <td>
                                            <span className={`${styles.badge} ${event.published ? styles.badgeGreen : styles.badgeGray}`}>
                                                {event.published ? "Publié" : "Brouillon"}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{event._count.tickets}</td>
                                        <td style={{ color: event._count.waitlistEntries > 0 ? "var(--color-accent)" : "var(--text-muted)" }}>
                                            {event._count.waitlistEntries}
                                        </td>
                                        <td>
                                            <Link href={`/admin/participants/${event.id}`} className="btn btn-secondary btn-sm">
                                                Gérer
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}