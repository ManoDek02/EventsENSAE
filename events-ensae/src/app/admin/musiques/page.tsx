"use client";
// src/app/admin/musiques/page.tsx

import { useEffect, useState, useCallback } from "react";
import { Music, CheckCircle2, AlertTriangle, ThumbsUp, ExternalLink, Filter, Mail } from "lucide-react";
import { AdminNav } from "../AdminNav";
import styles from "../admin.module.css";

type Suggestion = {
    id: string;
    title: string;
    artist: string;
    genre: string | null;
    link: string;
    platform: string;
    approved: boolean;
    createdAt: string;
    event: { id: string; title: string };
    user: { name: string; email: string };
    _count: { votes: number };
};

const PLATFORM_LABELS: Record<string, string> = {
    YOUTUBE: "YouTube", SPOTIFY: "Spotify", SOUNDCLOUD: "SoundCloud", OTHER: "Autre",
};

export default function AdminMusiquesPage() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("pending");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [announcing, setAnnouncing] = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setSelected(new Set());
        try {
            const res = await fetch(`/api/admin/musiques?status=${status}`);
            const data = await res.json();
            setSuggestions(data.suggestions ?? []);
        } catch {
            setError("Impossible de charger les suggestions.");
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { load(); }, [load]);

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        setSelected(new Set(suggestions.map((s) => s.id)));
    };

    const batchUpdate = async (approved: boolean) => {
        const ids = selected.size > 0 ? [...selected] : suggestions.map((s) => s.id);
        if (ids.length === 0) return;
        setSuccess(""); setError("");
        const res = await fetch("/api/admin/musiques", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, approved }),
        });
        const data = await res.json();
        if (res.ok) { setSuccess(data.message); load(); }
        else setError(data.error ?? "Erreur.");
    };

    const singleUpdate = async (id: string, approved: boolean) => {
        setSuccess(""); setError("");
        const res = await fetch(`/api/music/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ approved }),
        });
        if (res.ok) { setSuccess(approved ? "Suggestion approuvée." : "Suggestion refusée."); load(); }
        else setError("Erreur lors de la mise à jour.");
    };

    const announcePlaylist = async () => {
        /* Récupérer l'eventId depuis les suggestions affichées */
        const eventId = suggestions[0]?.event?.id;
        if (!eventId) {
            setError("Aucun événement sélectionné. Filtrez par événement d'abord.");
            return;
        }
        const eventTitle = suggestions[0]?.event?.title;
        if (!confirm(`Envoyer la playlist finale par email à tous les participants confirmés de "${eventTitle}" ?`)) return;

        setAnnouncing(true); setSuccess(""); setError("");
        try {
            const res = await fetch("/api/admin/musiques/announce", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId }),
            });
            const data = await res.json();
            if (res.ok) setSuccess(data.message);
            else setError(data.error ?? "Erreur lors de l'envoi.");
        } catch {
            setError("Erreur réseau. Réessayez.");
        } finally {
            setAnnouncing(false);
        }
    };

    /* Tri par votes pour affichage classement */
    const sorted = [...suggestions].sort((a, b) => b._count.votes - a._count.votes);

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <div className={styles.pageHeaderInner}>
                        <div>
                            <div className={styles.eyebrow}><Music size={13} /> Modération</div>
                            <h1 className={styles.pageTitle}>Musiques</h1>
                            <p className={styles.pageSubtitle}>Approuvez les suggestions et constituez la playlist finale.</p>
                        </div>
                        <div className={styles.pageActions}>
                            {selected.size > 0 && (
                                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                    {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
                                </span>
                            )}
                            <button className="btn btn-secondary btn-sm" onClick={selectAll}>Tout sélectionner</button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => batchUpdate(true)}
                                disabled={loading}
                            >
                                <CheckCircle2 size={14} /> Approuver la sélection
                            </button>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => batchUpdate(false)}
                                disabled={loading}
                                style={{ color: "var(--color-error)" }}
                            >
                                Refuser la sélection
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={announcePlaylist}
                                disabled={announcing || suggestions.length === 0}
                                title="Envoyer la playlist finale par email aux participants confirmés"
                            >
                                <Mail size={14} />
                                {announcing ? "Envoi…" : "Annoncer la playlist"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <AdminNav />

                {success && <div className={styles.alertSuccess}><CheckCircle2 size={15} /> {success}</div>}
                {error && <div className={styles.alertError}><AlertTriangle size={15} /> {error}</div>}

                <div className={styles.toolbar}>
                    <Filter size={15} style={{ color: "var(--text-muted)" }} />
                    <select
                        className={styles.filterSelect}
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="pending">En attente</option>
                        <option value="approved">Approuvées</option>
                        <option value="all">Toutes</option>
                    </select>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: 8 }}>
                        {suggestions.length} résultat{suggestions.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {loading ? (
                    <p style={{ color: "var(--text-muted)", padding: "32px 0" }}>Chargement…</p>
                ) : sorted.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}><Music size={24} /></div>
                        <p className={styles.emptyText}>Aucune suggestion dans cette catégorie.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: 32 }}>
                                        <input
                                            type="checkbox"
                                            checked={selected.size === suggestions.length && suggestions.length > 0}
                                            onChange={() => selected.size === suggestions.length ? setSelected(new Set()) : selectAll()}
                                        />
                                    </th>
                                    <th>#</th>
                                    <th>Titre / Artiste</th>
                                    <th>Événement</th>
                                    <th>Proposé par</th>
                                    <th>Plateforme</th>
                                    <th>Votes</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((s, i) => (
                                    <tr key={s.id} style={{ opacity: selected.size > 0 && !selected.has(s.id) ? 0.6 : 1 }}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selected.has(s.id)}
                                                onChange={() => toggleSelect(s.id)}
                                            />
                                        </td>
                                        <td style={{ fontWeight: 700, color: i < 3 ? "var(--color-accent)" : "var(--text-muted)", fontSize: "0.9rem" }}>
                                            {i + 1}
                                        </td>
                                        <td>
                                            <div className={styles.tableName}>{s.title}</div>
                                            <div className={styles.tableSub}>{s.artist}{s.genre ? ` · ${s.genre}` : ""}</div>
                                        </td>
                                        <td style={{ fontSize: "0.82rem" }}>{s.event.title}</td>
                                        <td>
                                            <div style={{ fontSize: "0.82rem" }}>{s.user.name}</div>
                                            <div className={styles.tableSub}>{s.user.email}</div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${styles.badgeBlue}`}>
                                                {PLATFORM_LABELS[s.platform] ?? s.platform}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                                                <ThumbsUp size={13} color="var(--color-primary)" /> {s._count.votes}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${s.approved ? styles.badgeGreen : styles.badgeGold}`}>
                                                {s.approved ? "Approuvée" : "En attente"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.tableActions}>
                                                <a href={s.link} target="_blank" rel="noopener noreferrer"
                                                    className="btn btn-ghost btn-sm" title="Écouter">
                                                    <ExternalLink size={13} />
                                                </a>
                                                {!s.approved ? (
                                                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--color-success)" }}
                                                        onClick={() => singleUpdate(s.id, true)}>
                                                        <CheckCircle2 size={13} /> Approuver
                                                    </button>
                                                ) : (
                                                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--color-error)" }}
                                                        onClick={() => singleUpdate(s.id, false)}>
                                                        Refuser
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
            </div>
        </div>
    );
}