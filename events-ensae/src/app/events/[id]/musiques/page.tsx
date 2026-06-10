import Link from "next/link";
import { ArrowLeft, ExternalLink, Music, ThumbsUp } from "lucide-react";
import { notFound } from "next/navigation";
import { getEventById, formatEventDate } from "@/lib/events";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MusicCard } from "@/components/music/MusicCard";
import styles from "@/app/music/music.module.css";
import eventStyles from "../../events.module.css";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const event = await getEventById(id);
    return {
        title: event
            ? `Playlist — ${event.title} | ENSAE Events`
            : "Playlist événement",
    };
}

export default async function EventMusiquesPage({ params }: Props) {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) notFound();

    /* Cet événement accepte-t-il les suggestions ? */
    const eventFull = await prisma.event.findUnique({
        where: { id },
        select: { allowsMusicSuggestions: true },
    });

    if (!eventFull?.allowsMusicSuggestions) {
        return (
            <main>
                <section className={eventStyles.detailHero}>
                    <div className={eventStyles.detailOverlay} />
                    <div className="container">
                        <div className={eventStyles.detailContent}>
                            <Link href={`/events/${id}`} className={eventStyles.backLink}>
                                <ArrowLeft size={17} /> Retour à l&apos;événement
                            </Link>
                            <div className={eventStyles.detailBadge}>
                                <Music size={15} /> Playlist
                            </div>
                            <h1 className={eventStyles.detailTitle}>{event.title}</h1>
                        </div>
                    </div>
                </section>
                <div className="container" style={{ padding: "64px 40px", textAlign: "center" }}>
                    <p style={{ color: "var(--text-muted)" }}>
                        Les suggestions musicales ne sont pas activées pour cet événement.
                    </p>
                </div>
            </main>
        );
    }

    const session = await getSession();
    const userId = session?.user?.id;

    /* Toutes les suggestions approuvées, triées par votes ───────── */
    const suggestions = await prisma.musicSuggestion.findMany({
        where: { eventId: id, approved: true },
        include: {
            event: { select: { title: true } },
            user: { select: { name: true } },
            _count: { select: { votes: true } },
        },
        orderBy: { votes: { _count: "desc" } },
    });

    /* Votes de l'utilisateur courant ───────────────────────────── */
    const userVotedIds = userId
        ? new Set(
            (
                await prisma.vote.findMany({
                    where: {
                        userId,
                        musicSuggestionId: { in: suggestions.map((s) => s.id) },
                    },
                    select: { musicSuggestionId: true },
                })
            ).map((v) => v.musicSuggestionId)
        )
        : new Set<string>();

    const trendingIds = new Set(
        suggestions.filter((s) => s._count.votes >= 2).slice(0, 3).map((s) => s.id)
    );

    const top3 = suggestions.slice(0, 3);
    const others = suggestions.slice(3);
    const totalVotes = suggestions.reduce((sum, s) => sum + s._count.votes, 0);

    return (
        <main>
            {/* ─── Hero ──────────────────────────────────────────── */}
            <section className={eventStyles.detailHero}>
                <div className={eventStyles.detailOverlay} />
                <div className="container">
                    <div className={eventStyles.detailContent}>
                        <Link href={`/events/${id}`} className={eventStyles.backLink}>
                            <ArrowLeft size={17} /> Retour à l&apos;événement
                        </Link>
                        <div className={eventStyles.detailBadge}>
                            <Music size={15} /> Playlist communautaire
                        </div>
                        <h1 className={eventStyles.detailTitle}>{event.title}</h1>
                        <p className={eventStyles.detailLead}>
                            {formatEventDate(event.date)} · {suggestions.length} musique{suggestions.length !== 1 ? "s" : ""} · {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
            </section>

            <div className="container" style={{ padding: "48px 40px 80px" }}>

                {suggestions.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}><Music size={28} /></div>
                        <h2 className={styles.emptyTitle}>Aucune musique pour le moment</h2>
                        <p className={styles.emptyText}>
                            Soyez le premier à proposer une musique pour la playlist de cet événement.
                        </p>
                        {session && (
                            <Link
                                href={`/music/proposer?eventId=${id}`}
                                className="btn btn-primary"
                            >
                                <Music size={16} /> Proposer la première musique
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── Top 3 ──────────────────────────────────── */}
                        {top3.length > 0 && (
                            <div style={{ marginBottom: "48px" }}>
                                <h2 style={{
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    marginBottom: "20px",
                                    display: "flex", alignItems: "center", gap: "10px"
                                }}>
                                    <ThumbsUp size={18} color="var(--color-accent)" />
                                    Top musiques
                                </h2>

                                <div style={{
                                    display: "flex", flexDirection: "column", gap: "1px",
                                    background: "var(--border-subtle)", borderRadius: "var(--radius-lg)",
                                    overflow: "hidden", border: "1px solid var(--border-subtle)"
                                }}>
                                    {top3.map((s, i) => (
                                        <div key={s.id} style={{
                                            display: "flex", alignItems: "center", gap: "16px",
                                            padding: "16px 20px", background: "var(--bg-surface)"
                                        }}>
                                            <span className={`${styles.rankBadge} ${i === 0 ? styles.rankBadge1 :
                                                i === 1 ? styles.rankBadge2 :
                                                    styles.rankBadge3
                                                }`}>
                                                {i + 1}
                                            </span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: 700, fontSize: "0.95rem",
                                                    color: "var(--text-primary)", whiteSpace: "nowrap",
                                                    overflow: "hidden", textOverflow: "ellipsis"
                                                }}>
                                                    {s.title}
                                                </div>
                                                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                                    {s.artist}
                                                </div>
                                            </div>
                                            <div style={{
                                                display: "flex", alignItems: "center",
                                                gap: "14px", flexShrink: 0
                                            }}>
                                                <span style={{
                                                    display: "flex", alignItems: "center",
                                                    gap: "5px", fontSize: "0.85rem", fontWeight: 700,
                                                    color: "var(--color-primary)"
                                                }}>
                                                    <ThumbsUp size={13} /> {s._count.votes}
                                                </span>
                                                <a href={s.link} target="_blank" rel="noopener noreferrer"
                                                    className={styles.listenBtn}
                                                    style={{ padding: "6px 12px", fontSize: "0.78rem" }}>
                                                    <ExternalLink size={12} /> Écouter
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Toutes les musiques ─────────────────────── */}
                        {others.length > 0 && (
                            <div>
                                <h2 style={{
                                    fontFamily: "var(--font-heading)",
                                    fontSize: "1.1rem",
                                    fontWeight: 700,
                                    marginBottom: "20px",
                                    color: "var(--text-secondary)"
                                }}>
                                    Toutes les propositions
                                </h2>
                                <div className={styles.grid}>
                                    {others.map((s) => (
                                        <MusicCard
                                            key={s.id}
                                            id={s.id}
                                            title={s.title}
                                            artist={s.artist}
                                            genre={s.genre}
                                            platform={s.platform}
                                            link={s.link}
                                            eventTitle={s.event.title}
                                            proposedBy={s.user.name}
                                            voteCount={s._count.votes}
                                            initialVoted={userVotedIds.has(s.id)}
                                            isLoggedIn={!!userId}
                                            isTrending={trendingIds.has(s.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── CTA proposer ────────────────────────────── */}
                        {session && (
                            <div style={{ textAlign: "center", marginTop: "48px" }}>
                                <Link href={`/music/proposer?eventId=${id}`} className="btn btn-accent">
                                    <Music size={16} />
                                    Proposer une musique pour cet événement
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}