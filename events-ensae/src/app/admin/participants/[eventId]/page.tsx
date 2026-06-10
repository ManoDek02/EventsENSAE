"use client";
// src/app/admin/participants/[eventId]/page.tsx
// Version complète avec section PENDING_REVIEW

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft, Download, Users, CheckCircle2, AlertTriangle,
    Clock, XCircle, QrCode, Bell,
} from "lucide-react";
import { AdminNav } from "../../AdminNav";
import styles from "../../admin.module.css";

type Ticket = {
    id: string;
    qrCode: string;
    status: "PENDING" | "PENDING_REVIEW" | "CONFIRMED" | "SCANNED" | "CANCELLED";
    createdAt: string;
    user: { name: string; email: string; filiere: string | null; promotion: string | null };
};

type WaitlistEntry = {
    id: string;
    createdAt: string;
    user: { name: string; email: string; filiere: string | null; promotion: string | null };
};

type Stats = {
    total: number; confirmed: number; pending: number; pendingReview: number;
    scanned: number; cancelled: number; waitlistCount: number;
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "En attente", PENDING_REVIEW: "Paiement à vérifier",
    CONFIRMED: "Confirmé", SCANNED: "Utilisé", CANCELLED: "Annulé",
};

const STATUS_BADGE: Record<string, string> = {
    PENDING: "badgeGray", PENDING_REVIEW: "badgeGold",
    CONFIRMED: "badgeGreen", SCANNED: "badgeBlue", CANCELLED: "badgeRed",
};

export default function ParticipantsPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [eventTitle, setEventTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/participants/${eventId}`);
            const data = await res.json();
            setTickets(data.tickets ?? []);
            setWaitlist(data.waitlist ?? []);
            /* Calculer pendingReview côté client */
            const t = data.tickets ?? [];
            setStats({
                total: t.length,
                confirmed: t.filter((x: Ticket) => x.status === "CONFIRMED").length,
                pending: t.filter((x: Ticket) => x.status === "PENDING").length,
                pendingReview: t.filter((x: Ticket) => x.status === "PENDING_REVIEW").length,
                scanned: t.filter((x: Ticket) => x.status === "SCANNED").length,
                cancelled: t.filter((x: Ticket) => x.status === "CANCELLED").length,
                waitlistCount: (data.waitlist ?? []).length,
            });
            setEventTitle(data.event?.title ?? "");
        } catch {
            setError("Impossible de charger les participants.");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { load(); }, [load]);

    const updateStatus = async (ticketId: string, status: string) => {
        setUpdatingId(ticketId); setSuccess(""); setError("");
        const res = await fetch(`/api/admin/participants/${eventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticketId, status }),
        });
        const data = await res.json();
        if (res.ok) { setSuccess(data.message ?? "Statut mis à jour."); load(); }
        else setError(data.error ?? "Erreur lors de la mise à jour.");
        setUpdatingId(null);
    };

    const exportCsv = () => {
        window.open(`/api/admin/participants/${eventId}?format=csv`, "_blank");
    };

    /* Séparer les billets à vérifier en premier */
    const pendingReview = tickets.filter((t) => t.status === "PENDING_REVIEW");
    const others = tickets.filter((t) => t.status !== "PENDING_REVIEW");

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <div className={styles.pageHeaderInner}>
                        <div>
                            <div className={styles.eyebrow}><Users size={13} /> Participants</div>
                            <h1 className={styles.pageTitle}>{eventTitle || "Chargement…"}</h1>
                            <p className={styles.pageSubtitle}>Gérez les billets et confirmez les paiements.</p>
                        </div>
                        <div className={styles.pageActions}>
                            <button className="btn btn-secondary" onClick={exportCsv}>
                                <Download size={15} /> Export CSV
                            </button>
                            <Link href="/admin/participants" className="btn btn-ghost btn-sm">
                                <ArrowLeft size={14} /> Tous les événements
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <AdminNav />

                {success && <div className={styles.alertSuccess}><CheckCircle2 size={15} /> {success}</div>}
                {error && <div className={styles.alertError}><AlertTriangle size={15} /> {error}</div>}

                {/* Stats */}
                {stats && (
                    <div className={styles.statsGrid} style={{ marginBottom: 24 }}>
                        <div className={styles.statCard}><div className={styles.statValue}>{stats.total}</div><div className={styles.statLabel}>Inscrits</div></div>
                        <div className={styles.statCard}><div className={styles.statValue}>{stats.confirmed}</div><div className={styles.statLabel}>Confirmés</div></div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue} style={{ color: stats.pendingReview > 0 ? "var(--color-accent)" : undefined }}>
                                {stats.pendingReview}
                            </div>
                            <div className={styles.statLabel}>Paiements à vérifier</div>
                        </div>
                        <div className={styles.statCard}><div className={styles.statValue}>{stats.scanned}</div><div className={styles.statLabel}>Scannés</div></div>
                        <div className={styles.statCard}><div className={styles.statValue}>{stats.waitlistCount}</div><div className={styles.statLabel}>Liste d&apos;attente</div></div>
                    </div>
                )}

                {loading ? (
                    <p style={{ color: "var(--text-muted)", padding: "32px 0" }}>Chargement…</p>
                ) : (
                    <>
                        {/* ── Paiements à vérifier en premier ─────────── */}
                        {pendingReview.length > 0 && (
                            <>
                                <div className={styles.alertError} style={{ marginBottom: 16, alignItems: "center" }}>
                                    <Bell size={16} />
                                    <strong>{pendingReview.length} paiement{pendingReview.length > 1 ? "s" : ""} à vérifier</strong>
                                    <span style={{ fontWeight: 400, marginLeft: 4 }}>— confirmez ou rejetez chaque billet après avoir vérifié le virement.</span>
                                </div>

                                <div className={styles.tableWrap} style={{ marginBottom: 32, border: "1px solid rgba(184,134,26,0.3)" }}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Participant</th>
                                                <th>Filière / Promo</th>
                                                <th>Inscription</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingReview.map((t) => (
                                                <tr key={t.id} style={{ background: "rgba(184,134,26,0.04)" }}>
                                                    <td>
                                                        <div className={styles.tableName}>{t.user.name}</div>
                                                        <div className={styles.tableSub}>{t.user.email}</div>
                                                    </td>
                                                    <td style={{ fontSize: "0.82rem" }}>
                                                        {[t.user.filiere, t.user.promotion].filter(Boolean).join(" · ") || "—"}
                                                    </td>
                                                    <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                                        {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                                                    </td>
                                                    <td>
                                                        <div className={styles.tableActions}>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                style={{ color: "var(--color-success)", fontWeight: 700 }}
                                                                onClick={() => updateStatus(t.id, "CONFIRMED")}
                                                                disabled={updatingId === t.id}
                                                            >
                                                                <CheckCircle2 size={14} /> Confirmer
                                                            </button>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                style={{ color: "var(--color-error)" }}
                                                                onClick={() => updateStatus(t.id, "CANCELLED")}
                                                                disabled={updatingId === t.id}
                                                            >
                                                                <XCircle size={14} /> Rejeter
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── Tous les autres billets ──────────────────── */}
                        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                            <QrCode size={16} color="var(--color-accent)" /> Tous les billets ({tickets.length})
                        </h2>

                        {tickets.length === 0 ? (
                            <div className={styles.empty} style={{ marginBottom: 32 }}>
                                <div className={styles.emptyIcon}><Users size={22} /></div>
                                <p className={styles.emptyText}>Aucun billet pour cet événement.</p>
                            </div>
                        ) : (
                            <div className={styles.tableWrap} style={{ marginBottom: 32 }}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Participant</th>
                                            <th>Filière / Promo</th>
                                            <th>Inscription</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {others.map((t) => (
                                            <tr key={t.id}>
                                                <td>
                                                    <div className={styles.tableName}>{t.user.name}</div>
                                                    <div className={styles.tableSub}>{t.user.email}</div>
                                                </td>
                                                <td style={{ fontSize: "0.82rem" }}>
                                                    {[t.user.filiere, t.user.promotion].filter(Boolean).join(" · ") || "—"}
                                                </td>
                                                <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                                    {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                                                </td>
                                                <td>
                                                    <span className={`${styles.badge} ${styles[STATUS_BADGE[t.status] ?? "badgeGray"]}`}>
                                                        {STATUS_LABELS[t.status] ?? t.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.tableActions}>
                                                        {t.status === "PENDING" && (
                                                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--color-success)", fontSize: "0.78rem" }}
                                                                onClick={() => updateStatus(t.id, "CONFIRMED")} disabled={updatingId === t.id}>
                                                                <CheckCircle2 size={13} /> Confirmer
                                                            </button>
                                                        )}
                                                        {t.status === "CONFIRMED" && (
                                                            <button className="btn btn-ghost btn-sm" style={{ fontSize: "0.78rem" }}
                                                                onClick={() => updateStatus(t.id, "SCANNED")} disabled={updatingId === t.id}>
                                                                <QrCode size={13} /> Marquer scanné
                                                            </button>
                                                        )}
                                                        {t.status !== "CANCELLED" && t.status !== "SCANNED" && (
                                                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--color-error)", fontSize: "0.78rem" }}
                                                                onClick={() => updateStatus(t.id, "CANCELLED")} disabled={updatingId === t.id}>
                                                                <XCircle size={13} /> Annuler
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── Liste d'attente ──────────────────────────── */}
                        {waitlist.length > 0 && (
                            <>
                                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.05rem", fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                    <Clock size={16} color="var(--color-accent)" /> Liste d&apos;attente ({waitlist.length})
                                </h2>
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead><tr><th>Participant</th><th>Filière / Promo</th><th>Inscription</th></tr></thead>
                                        <tbody>
                                            {waitlist.map((w) => (
                                                <tr key={w.id}>
                                                    <td><div className={styles.tableName}>{w.user.name}</div><div className={styles.tableSub}>{w.user.email}</div></td>
                                                    <td style={{ fontSize: "0.82rem" }}>{[w.user.filiere, w.user.promotion].filter(Boolean).join(" · ") || "—"}</td>
                                                    <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{new Date(w.createdAt).toLocaleDateString("fr-FR")}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}