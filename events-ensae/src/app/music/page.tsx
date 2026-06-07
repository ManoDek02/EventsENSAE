import Link from "next/link";
import { Calendar, Music, PlusCircle } from "lucide-react";
import { requireAuth } from "@/lib/session";
import styles from "../app-page.module.css";

export const metadata = {
  title: "Musiques | ENSAE Events",
};

export default async function MusicPage() {
  await requireAuth();

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className="container">
          <div className={styles.eyebrow}>
            <Music size={15} />
            Communauté
          </div>
          <h1 className={styles.title}>Musiques</h1>
          <p className={styles.subtitle}>
            Proposez des titres pour les playlists des événements et votez pour vos favoris.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Music size={28} />
            </div>
            <h2 className={styles.emptyTitle}>Module musique bientôt disponible</h2>
            <p className={styles.emptyText}>
              Vous pourrez bientôt proposer des musiques, voter pour la playlist de chaque événement
              et suivre le classement communautaire.
            </p>
            <div className={styles.actions} style={{ justifyContent: "center" }}>
              <button className="btn btn-secondary" disabled>
                <PlusCircle size={16} />
                Proposer une musique
              </button>
              <Link href="/events" className="btn btn-primary">
                <Calendar size={16} />
                Voir les événements
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
