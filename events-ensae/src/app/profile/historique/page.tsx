import Link from "next/link";
import { Calendar, Music, ThumbsUp, MapPin, ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/events";
import styles from "../profile.module.css";

export const metadata = { title: "Historique | ENSAE Events" };

export default async function HistoriquePage() {
    const session = await requireAuth();
    const userId = session.user.id;

    const [pastTickets, musicSuggestions, votes] = await Promise.all([
        prisma.ticket.findMany({
            where: {
                userId,
                status: { in: ["CONFIRMED", "SCANNED"] },
                event: { date: { lt: new Date() } },
            },
            include: { event: true },
            orderBy: { event: { date: "desc" } },
        }),

        prisma.musicSuggestion.findMany({
            where: { userId },
            include: {
                event: { select: { title: true } },
                _count: { select: { votes: true } },
            },
            orderBy: { createdAt: "desc" },
        }),

        prisma.vote.findMany({
            where: { userId },
            include: {
                musicSuggestion: {
                    include: { event: { select: { title: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return (
        <div>
            {/* ─── Header ─────────────────────────────────────────── */}
            <section className={styles.hero}>
                <div className="container">
                    <div className={styles.heroInner}>
                        <div className={styles.heroInfo}>
                            <h1 className={styles.heroName}>Historique</h1>
                            <p className={styles.heroEmail}>
                                Vos événements passés, musiques proposées et votes
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.content}>
                <div className="container">
                    <div style={{ marginBottom: "28px" }}>
                        <Link
                            href="/profile"
                            className="btn btn-ghost btn-sm"
                            style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}
                        >
                            <ArrowLeft size={15} /> Retour au profil
                        </Link>
                    </div>

                    {/* ── 1. Événements passés ──────────────────────── */}
                    <div className={styles.sectionTitle}>
                        <span className={styles.sectionTitleDot} />
                        <Calendar size={17} />
                        Événements passés
                        <span style={{
                            marginLeft: "auto", fontSize: "0.82rem",
                            fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-body)"
                        }}>
                            {pastTickets.length} participation{pastTickets.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {pastTickets.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}><Calendar size={22} /></div>
                            <p className={styles.emptyText}>
                                Vous n&apos;avez pas encore participé à un événement.
                            </p>
                        </div>
                    ) : (
                        <div className={styles.historyList}>
                            {pastTickets.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/events/${item.event.id}`}
                                    className={styles.historyItem}
                                    style={{ textDecoration: "none" }}
                                >
                                    <div className={styles.historyItemIcon}>
                                        <Calendar size={17} />
                                    </div>
                                    <div className={styles.historyItemBody}>
                                        <div className={styles.historyItemTitle}>{item.event.title}</div>
                                        <div className={styles.historyItemMeta}>
                                            {formatEventDate(item.event.date)}
                                            &nbsp;·&nbsp;
                                            <MapPin size={11} style={{ display: "inline", verticalAlign: "middle" }} />
                                            &nbsp;{item.event.location}
                                        </div>
                                    </div>
                                    <span className={`${styles.historyItemBadge} ${item.status === "SCANNED"
                                        ? styles.historyItemBadgeGray
                                        : styles.historyItemBadgeGreen
                                        }`}>
                                        {item.status === "SCANNED" ? "Utilisé" : "Confirmé"}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* ── 2. Musiques proposées ─────────────────────── */}
                    <div className={styles.sectionTitle}>
                        <span className={styles.sectionTitleDot} />
                        <Music size={17} />
                        Musiques proposées
                        <span style={{
                            marginLeft: "auto", fontSize: "0.82rem",
                            fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-body)"
                        }}>
                            {musicSuggestions.length} proposition{musicSuggestions.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {musicSuggestions.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}><Music size={22} /></div>
                            <p className={styles.emptyText}>
                                Vous n&apos;avez pas encore proposé de musique.
                            </p>
                        </div>
                    ) : (
                        <div className={styles.historyList}>
                            {musicSuggestions.map((s) => (
                                <div key={s.id} className={styles.historyItem}>
                                    <div className={styles.historyItemIcon}>
                                        <Music size={17} />
                                    </div>
                                    <div className={styles.historyItemBody}>
                                        <div className={styles.historyItemTitle}>
                                            {s.title} — <span style={{ fontWeight: 400 }}>{s.artist}</span>
                                        </div>
                                        <div className={styles.historyItemMeta}>
                                            {s.event.title} · {s._count.votes} vote{s._count.votes !== 1 ? "s" : ""}
                                        </div>
                                    </div>
                                    <span className={`${styles.historyItemBadge} ${s.approved
                                        ? styles.historyItemBadgeGreen
                                        : styles.historyItemBadgeGold
                                        }`}>
                                        {s.approved ? "Approuvée" : "En attente"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── 3. Votes effectués ───────────────────────── */}
                    <div className={styles.sectionTitle}>
                        <span className={styles.sectionTitleDot} />
                        <ThumbsUp size={17} />
                        Votes effectués
                        <span style={{
                            marginLeft: "auto", fontSize: "0.82rem",
                            fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-body)"
                        }}>
                            {votes.length} vote{votes.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {votes.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}><ThumbsUp size={22} /></div>
                            <p className={styles.emptyText}>
                                Vous n&apos;avez pas encore voté pour une musique.
                            </p>
                        </div>
                    ) : (
                        <div className={styles.historyList}>
                            {votes.map((v) => (
                                <div key={v.id} className={styles.historyItem}>
                                    <div className={styles.historyItemIcon}>
                                        <ThumbsUp size={17} />
                                    </div>
                                    <div className={styles.historyItemBody}>
                                        <div className={styles.historyItemTitle}>
                                            {v.musicSuggestion.title} — <span style={{ fontWeight: 400 }}>{v.musicSuggestion.artist}</span>
                                        </div>
                                        <div className={styles.historyItemMeta}>
                                            {v.musicSuggestion.event.title}
                                        </div>
                                    </div>
                                    <span className={`${styles.historyItemBadge} ${styles.historyItemBadgeGold}`}>
                                        Voté
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </section>
        </div>
    );
}