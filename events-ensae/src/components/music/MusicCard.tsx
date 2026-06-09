"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ThumbsUp, TrendingUp } from "lucide-react";
import styles from "@/app/music/music.module.css";

type Platform = "YOUTUBE" | "SPOTIFY" | "SOUNDCLOUD" | "OTHER";

export type MusicCardData = {
    id: string;
    title: string;
    artist: string;
    genre: string | null;
    platform: Platform;
    link: string;
    eventTitle: string;
    proposedBy: string;
    voteCount: number;
    initialVoted: boolean;
    isLoggedIn: boolean;
    isTrending?: boolean;
};

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string }> = {
    YOUTUBE: { label: "YouTube", color: "#FF0000", bg: "rgba(255,0,0,0.09)" },
    SPOTIFY: { label: "Spotify", color: "#1DB954", bg: "rgba(29,185,84,0.09)" },
    SOUNDCLOUD: { label: "SoundCloud", color: "#FF5500", bg: "rgba(255,85,0,0.09)" },
    OTHER: { label: "Lien", color: "#1B3A6E", bg: "rgba(27,58,110,0.09)" },
};

export function MusicCard({
    id, title, artist, genre, platform, link,
    eventTitle, proposedBy, voteCount, initialVoted, isLoggedIn, isTrending,
}: MusicCardData) {
    const router = useRouter();
    const [voted, setVoted] = useState(initialVoted);
    const [count, setCount] = useState(voteCount);
    const [loading, setLoading] = useState(false);

    const cfg = PLATFORM_CONFIG[platform];

    const handleVote = async () => {
        if (!isLoggedIn) {
            router.push("/auth/login?callbackUrl=/music");
            return;
        }
        if (loading) return;

        const wasVoted = voted;
        setVoted(!wasVoted);
        setCount((c) => (wasVoted ? c - 1 : c + 1));
        setLoading(true);

        try {
            const res = await fetch(`/api/music/${id}/vote`, { method: "POST" });
            if (!res.ok) {
                setVoted(wasVoted);
                setCount((c) => (wasVoted ? c + 1 : c - 1));
            }
        } catch {
            setVoted(wasVoted);
            setCount((c) => (wasVoted ? c + 1 : c - 1));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardBand} style={{ background: cfg.color }} />

            <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                    <span
                        className={styles.platformBadge}
                        style={{ color: cfg.color, background: cfg.bg }}
                    >
                        {cfg.label}
                    </span>
                    {genre && <span className={styles.genreBadge}>{genre}</span>}
                    {isTrending && (
                        <span className={styles.trendingBadge}>
                            <TrendingUp size={10} /> En tendance
                        </span>
                    )}
                </div>

                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.cardArtist}>{artist}</p>
                <p className={styles.cardEvent}>{eventTitle}</p>
                <p className={styles.cardProposer}>
                    Proposé par {proposedBy}
                </p>
            </div>

            <div className={styles.cardFooter}>
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.listenBtn}
                    style={{ background: cfg.color }}
                >
                    <ExternalLink size={13} />
                    Écouter
                </a>

                <button
                    className={`${styles.voteBtn} ${voted ? styles.voteBtnActive : ""}`}
                    onClick={handleVote}
                    disabled={loading}
                    title={voted ? "Retirer mon vote" : "Voter pour cette musique"}
                >
                    <ThumbsUp size={13} />
                    <span>{count}</span>
                </button>
            </div>
        </div>
    );
}