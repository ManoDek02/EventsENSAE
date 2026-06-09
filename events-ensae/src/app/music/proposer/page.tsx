"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Music, Link as LinkIcon } from "lucide-react";
import styles from "../music.module.css";

type MusicEvent = { id: string; title: string };
type Platform = "YOUTUBE" | "SPOTIFY" | "SOUNDCLOUD" | "OTHER";

const GENRES = [
    "Afrobeats", "Hip-Hop", "R&B", "Pop", "Électronique",
    "Jazz", "Classique", "Reggae", "Amapiano", "Mbalax", "Autre",
];

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string }> = {
    YOUTUBE: { label: "YouTube", color: "#FF0000", bg: "rgba(255,0,0,0.09)" },
    SPOTIFY: { label: "Spotify", color: "#1DB954", bg: "rgba(29,185,84,0.09)" },
    SOUNDCLOUD: { label: "SoundCloud", color: "#FF5500", bg: "rgba(255,85,0,0.09)" },
    OTHER: { label: "Lien audio", color: "#1B3A6E", bg: "rgba(27,58,110,0.09)" },
};

function detectPlatform(url: string): Platform {
    if (!url) return "OTHER";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "YOUTUBE";
    if (url.includes("spotify.com")) return "SPOTIFY";
    if (url.includes("soundcloud.com")) return "SOUNDCLOUD";
    return "OTHER";
}

export default function ProposerMusicPage() {
    const router = useRouter();

    const [events, setEvents] = useState<MusicEvent[]>([]);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        title: "",
        artist: "",
        genre: "",
        link: "",
        eventId: "",
    });

    const platform = detectPlatform(form.link);
    const platformCfg = PLATFORM_CONFIG[platform];

    /* Charger les événements avec musique activée */
    useEffect(() => {
        fetch("/api/music/events")
            .then((r) => r.json())
            .then((data) => setEvents(data.events ?? []))
            .catch(() => setError("Impossible de charger les événements."))
            .finally(() => setFetching(false));
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title.trim()) return setError("Le titre est obligatoire.");
        if (!form.artist.trim()) return setError("L'artiste est obligatoire.");
        if (!form.link.trim()) return setError("Le lien est obligatoire.");
        if (!form.eventId) return setError("Choisissez un événement.");

        /* Validation basique de l'URL */
        try { new URL(form.link); } catch {
            return setError("Le lien n'est pas une URL valide.");
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/music", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, platform }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Une erreur est survenue.");
            } else {
                setSuccess(
                    "Votre proposition a été envoyée. Elle sera visible après validation par un administrateur."
                );
                setTimeout(() => router.push("/music"), 2500);
            }
        } catch {
            setError("Impossible de contacter le serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <div className={styles.eyebrow}>
                        <Music size={14} /> Communauté
                    </div>
                    <h1 className={styles.title}>Proposer une musique</h1>
                    <p className={styles.subtitle}>
                        Votre suggestion sera soumise à validation avant d&apos;apparaître dans le feed.
                    </p>
                </div>
            </header>

            <div className="container" style={{ paddingTop: "32px" }}>
                <div style={{ marginBottom: "24px" }}>
                    <Link href="/music" className="btn btn-ghost btn-sm"
                        style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                        <ArrowLeft size={15} /> Retour aux musiques
                    </Link>
                </div>

                <div className={styles.formCard}>
                    {success && (
                        <div className={`${styles.formAlert} ${styles.formAlertSuccess}`}>
                            <CheckCircle2 size={15} /> {success}
                        </div>
                    )}
                    {error && (
                        <div className={`${styles.formAlert} ${styles.formAlertError}`}>
                            <AlertTriangle size={15} /> {error}
                        </div>
                    )}

                    {fetching ? (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                            Chargement des événements…
                        </p>
                    ) : events.length === 0 ? (
                        <div className={styles.empty} style={{ padding: "32px", margin: 0 }}>
                            <div className={styles.emptyIcon}><Music size={24} /></div>
                            <p className={styles.emptyText}>
                                Aucun événement n&apos;accepte de suggestions musicales pour le moment.
                                Les playlists sont ouvertes pour le Dîner de Gala et les journées d&apos;intégration.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "28px" }}>

                                {/* Événement — en premier pour cadrer la proposition */}
                                <div className="form-group">
                                    <label className="form-label" htmlFor="eventId">
                                        Événement <span style={{ color: "var(--color-error)" }}>*</span>
                                    </label>
                                    <select
                                        id="eventId" name="eventId"
                                        className="form-input"
                                        value={form.eventId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">— Choisir un événement —</option>
                                        {events.map((ev) => (
                                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Lien — détection plateforme auto */}
                                <div className="form-group">
                                    <label className="form-label" htmlFor="link">
                                        Lien YouTube / Spotify / SoundCloud <span style={{ color: "var(--color-error)" }}>*</span>
                                    </label>
                                    <input
                                        id="link" name="link" type="url"
                                        className="form-input"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        value={form.link}
                                        onChange={handleChange}
                                        required
                                    />
                                    {form.link && (
                                        <div
                                            className={styles.platformPreview}
                                            style={{ color: platformCfg.color, background: platformCfg.bg }}
                                        >
                                            <LinkIcon size={14} />
                                            Plateforme détectée : <strong>{platformCfg.label}</strong>
                                        </div>
                                    )}
                                </div>

                                {/* Titre + Artiste */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="title">
                                            Titre <span style={{ color: "var(--color-error)" }}>*</span>
                                        </label>
                                        <input
                                            id="title" name="title" type="text"
                                            className="form-input"
                                            placeholder="Titre de la chanson"
                                            value={form.title}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="artist">
                                            Artiste <span style={{ color: "var(--color-error)" }}>*</span>
                                        </label>
                                        <input
                                            id="artist" name="artist" type="text"
                                            className="form-input"
                                            placeholder="Nom de l'artiste"
                                            value={form.artist}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Genre */}
                                <div className="form-group">
                                    <label className="form-label" htmlFor="genre">Genre</label>
                                    <select
                                        id="genre" name="genre"
                                        className="form-input"
                                        value={form.genre}
                                        onChange={handleChange}
                                    >
                                        <option value="">— Optionnel —</option>
                                        {GENRES.map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                            </div>

                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    <Music size={16} />
                                    {loading ? "Envoi en cours…" : "Envoyer la proposition"}
                                </button>
                                <Link href="/music" className="btn btn-secondary">Annuler</Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}