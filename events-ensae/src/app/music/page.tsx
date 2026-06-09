import Link from "next/link";
import { Music, PlusCircle, SlidersHorizontal } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MusicCard } from "@/components/music/MusicCard";
import styles from "./music.module.css";

export const metadata = { title: "Musiques | ENSAE Events" };

type SearchParams = Promise<{
  eventId?: string;
  genre?: string;
  sort?: string;
}>;

export default async function MusicPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const eventId = params.eventId ?? "";
  const genre = params.genre ?? "";
  const sort = params.sort ?? "votes";

  const session = await getSession();
  const userId = session?.user?.id;

  /* ── Événements avec musique activée (pour le filtre) ─────── */
  const musicEvents = await prisma.event.findMany({
    where: { allowsMusicSuggestions: true, published: true },
    select: { id: true, title: true },
    orderBy: { date: "asc" },
  });

  /* ── Genres distincts ──────────────────────────────────────── */
  const genreRows = await prisma.musicSuggestion.findMany({
    where: { approved: true, genre: { not: null } },
    select: { genre: true },
    distinct: ["genre"],
    orderBy: { genre: "asc" },
  });
  const genres = genreRows.map((g) => g.genre).filter(Boolean) as string[];

  /* ── Suggestions approuvées ────────────────────────────────── */
  const suggestions = await prisma.musicSuggestion.findMany({
    where: {
      approved: true,
      ...(eventId ? { eventId } : {}),
      ...(genre ? { genre } : {}),
    },
    include: {
      event: { select: { title: true } },
      user: { select: { name: true } },
      _count: { select: { votes: true } },
    },
    orderBy:
      sort === "recent"
        ? { createdAt: "desc" }
        : { votes: { _count: "desc" } },
  });

  /* ── Votes de l'utilisateur ────────────────────────────────── */
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

  /* ── "En tendance" = top 3 suggestions avec au moins 2 votes ─ */
  const trendingIds = new Set(
    suggestions
      .filter((s) => s._count.votes >= 2)
      .slice(0, 3)
      .map((s) => s.id)
  );

  return (
    <div className={styles.page}>
      {/* ─── Header ───────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <div>
              <div className={styles.eyebrow}>
                <Music size={14} /> Communauté
              </div>
              <h1 className={styles.title}>Playlist communautaire</h1>
              <p className={styles.subtitle}>
                Votez pour les musiques qui joueront lors des événements.
                Chaque étudiant peut proposer et voter.
              </p>
            </div>
            {session && (
              <Link href="/music/proposer" className="btn btn-accent">
                <PlusCircle size={16} />
                Proposer une musique
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── Toolbar ──────────────────────────────────────────── */}
      <div className="container">
        <form className={styles.toolbar} action="/music">
          <select
            name="eventId"
            className={`form-input ${styles.toolbarSelect}`}
            defaultValue={eventId}
          >
            <option value="">Tous les événements</option>
            {musicEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>

          {genres.length > 0 && (
            <select
              name="genre"
              className={`form-input ${styles.toolbarSelect}`}
              defaultValue={genre}
            >
              <option value="">Tous les genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}

          <select
            name="sort"
            className={`form-input ${styles.toolbarSelect}`}
            defaultValue={sort}
          >
            <option value="votes">Les plus votées</option>
            <option value="recent">Les plus récentes</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            <SlidersHorizontal size={15} />
            Filtrer
          </button>
        </form>

        {/* ─── Grille ─────────────────────────────────────────── */}
        {suggestions.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Music size={28} />
            </div>
            <h2 className={styles.emptyTitle}>Aucune musique pour le moment</h2>
            <p className={styles.emptyText}>
              {session
                ? "Soyez le premier à proposer une musique pour la playlist !"
                : "Connectez-vous pour proposer et voter pour des musiques."}
            </p>
            {session ? (
              <Link href="/music/proposer" className="btn btn-primary">
                <PlusCircle size={16} />
                Proposer la première musique
              </Link>
            ) : (
              <Link href="/auth/login?callbackUrl=/music" className="btn btn-primary">
                Se connecter
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {suggestions.map((s) => (
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
        )}
      </div>
    </div>
  );
}