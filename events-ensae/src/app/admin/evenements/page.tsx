"use client";
// src/app/admin/evenements/page.tsx

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    Plus, Search, Eye, EyeOff, Pencil, Trash2,
    Calendar, CheckCircle2, AlertTriangle, Users,
} from "lucide-react";
import { AdminNav } from "../AdminNav";
import styles from "../admin.module.css";

type EventItem = {
    id: string;
    title: string;
    category: string;
    date: string;
    location: string;
    price: number;
    capacity: number;
    published: boolean;
    _count: { tickets: number; waitlistEntries: number };
};

const CATEGORY_LABELS: Record<string, string> = {
    SORTIE_PEDAGOGIQUE: "Sortie péda.",
    CHAMPIONNAT: "Championnat",
    GALA: "Gala",
    CONFERENCE: "Conférence",
    AUTRE: "Autre",
};

export default function AdminEvenementsPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/events");
            const data = await res.json();
            setEvents(data.events ?? []);
        } catch {
            setError("Impossible de charger les événements.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadEvents(); }, [loadEvents]);

    const togglePublish = async (id: string, published: boolean) => {
        setSuccess(""); setError("");
        const res = await fetch(`/api/admin/events/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ published: !published }),
        });
        if (res.ok) {
            setSuccess(published ? "Événement dépublié." : "Événement publié.");
            loadEvents();
        } else {
            setError("Erreur lors de la mise à jour.");
        }
    };

    const cancelEvent = async (id: string, title: string) => {
        if (!confirm(`Annuler l'événement "${title}" ? Cette action le dépubliera et fermera les inscriptions.`)) return;
        setSuccess(""); setError("");
        const res = await fetch(`/api/admin/events/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cancelled: true }),
        });
        if (res.ok) { setSuccess("Événement annulé."); loadEvents(); }
        else setError("Erreur lors de l'annulation.");
    };

    const deleteEvent = async (id: string, title: string) => {
        if (!confirm(`Supprimer définitivement "${title}" ? Tous les billets associés seront supprimés.`)) return;
        setSuccess(""); setError("");
        const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
        if (res.ok) { setSuccess("Événement supprimé."); loadEvents(); }
        else setError("Erreur lors de la suppression.");
    };

    const filtered = events.filter((e) => {
        const matchQ = q.trim() === "" || e.title.toLowerCase().includes(q.toLowerCase()) || e.location.toLowerCase().includes(q.toLowerCase());
        const matchFilter =
            filter === "all" ||
            (filter === "published" && e.published) ||
            (filter === "draft" && !e.published) ||
            (filter === "upcoming" && new Date(e.date) >= new Date());
        return matchQ && matchFilter;
    });

    const formatDate = (d: string) =>
        new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <div className={styles.pageHeaderInner}>
                        <div>
                            <div className={styles.eyebrow}><Calendar size={13} /> Gestion</div>
                            <h1 className={styles.pageTitle}>Événements</h1>
                            <p className={styles.pageSubtitle}>Créez, modifiez et publiez les événements.</p>
                        </div>
                        <div className={styles.pageActions}>
                            <Link href="/admin/evenements/nouveau" className="btn btn-primary">
                                <Plus size={16} /> Nouvel événement
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <AdminNav />

                {success && <div className={styles.alertSuccess}><CheckCircle2 size={15} /> {success}</div>}
                {error && <div className={styles.alertError}><AlertTriangle size={15} /> {error}</div>}

                <div className={styles.toolbar}>
                    <div className={styles.searchWrap}>
                        <Search size={15} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Rechercher un événement…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <select className={styles.filterSelect} value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">Tous</option>
                        <option value="published">Publiés</option>
                        <option value="draft">Brouillons</option>
                        <option value="upcoming">À venir</option>
                    </select>
                </div>

                {loading ? (
                    <p style={{ color: "var(--text-muted)", padding: "32px 0" }}>Chargement…</p>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}><Calendar size={24} /></div>
                        <p className={styles.emptyText}>Aucun événement trouvé.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Événement</th>
                                    <th>Catégorie</th>
                                    <th>Date</th>
                                    <th>Billets</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((event) => (
                                    <tr key={event.id}>
                                        <td>
                                            <div className={styles.tableName}>{event.title}</div>
                                            <div className={styles.tableSub}>{event.location} · {event.price === 0 ? "Gratuit" : `${event.price.toLocaleString("fr-FR")} FCFA`}</div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${styles.badgeBlue}`}>
                                                {CATEGORY_LABELS[event.category] ?? event.category}
                                            </span>
                                        </td>
                                        <td style={{ whiteSpace: "nowrap" }}>{formatDate(event.date)}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem" }}>
                                                <Users size={13} color="var(--text-muted)" />
                                                {event._count.tickets} / {event.capacity}
                                                {event._count.waitlistEntries > 0 && (
                                                    <span className={`${styles.badge} ${styles.badgeGold}`} style={{ marginLeft: 4 }}>
                                                        +{event._count.waitlistEntries} attente
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${event.published ? styles.badgeGreen : styles.badgeGray}`}>
                                                {event.published ? "Publié" : "Brouillon"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.tableActions}>
                                                <Link href={`/admin/evenements/${event.id}`} className="btn btn-ghost btn-sm" title="Modifier">
                                                    <Pencil size={14} />
                                                </Link>
                                                <Link href={`/admin/participants/${event.id}`} className="btn btn-ghost btn-sm" title="Participants">
                                                    <Users size={14} />
                                                </Link>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    title={event.published ? "Dépublier" : "Publier"}
                                                    onClick={() => togglePublish(event.id, event.published)}
                                                >
                                                    {event.published ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    title="Annuler l'événement"
                                                    onClick={() => cancelEvent(event.id, event.title)}
                                                    style={{ color: "var(--color-warning)" }}
                                                >
                                                    <AlertTriangle size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    title="Supprimer"
                                                    onClick={() => deleteEvent(event.id, event.title)}
                                                    style={{ color: "var(--color-error)" }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
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