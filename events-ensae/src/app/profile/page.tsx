import Link from "next/link";
import { CheckCircle2, Ticket, User } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import styles from "../app-page.module.css";

export const metadata = {
  title: "Mon Profil | ENSAE Events",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className="container">
          <div className={styles.eyebrow}>
            <User size={15} />
            Espace étudiant
          </div>
          <h1 className={styles.title}>Mon Profil</h1>
          <p className={styles.subtitle}>
            Gérez vos informations et accédez à vos billets pour les événements ENSAE.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Nom complet</div>
              <div className={styles.cardValue}>{user.name}</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Email</div>
              <div className={styles.cardValue}>{user.email}</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Filière</div>
              <div className={styles.cardValue}>{user.filiere ?? "Non renseignée"}</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Promotion</div>
              <div className={styles.cardValue}>{user.promotion ?? "Non renseignée"}</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Statut du compte</div>
              <div className={styles.cardValue}>
                {user.emailVerified ? (
                  <span className={styles.badgeSuccess}>
                    <CheckCircle2 size={14} />
                    Email vérifié
                  </span>
                ) : (
                  <span className={styles.badgeMuted}>Email non vérifié</span>
                )}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Rôle</div>
              <div className={styles.cardValue}>
                {user.role === "ADMIN" ? "Administrateur" : "Étudiant"}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/profile/tickets" className="btn btn-primary">
              <Ticket size={16} />
              Mes billets
            </Link>
            <Link href="/events" className="btn btn-secondary">
              Voir les événements
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
