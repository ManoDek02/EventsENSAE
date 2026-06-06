"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import styles from "../auth.module.css";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-token": "Le lien de vérification est invalide ou manquant.",
  "invalid-token": "Ce lien de vérification est invalide ou a déjà été utilisé.",
  "expired-token": "Ce lien de vérification a expiré. Veuillez vous réinscrire.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") ?? "unknown";
  const message =
    ERROR_MESSAGES[errorCode] ??
    "Une erreur inattendue s'est produite. Veuillez réessayer.";

  return (
    <div className={styles.authPage}>
      <div className={styles.authBg} />
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authIcon} style={{ background: "rgba(239, 68, 68, 0.2)", boxShadow: "none" }}>
            <XCircle size={32} color="#ef4444" />
          </div>
          <h1 className={styles.authTitle}>Erreur d&apos;authentification</h1>
          <p className={styles.authSubtitle}>{message}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
          <Link href="/auth/register" className="btn btn-primary" style={{ display: "flex", justifyContent: "center" }}>
            <RefreshCw size={16} /> Créer un nouveau compte
          </Link>
          <Link href="/auth/login" className="btn btn-secondary" style={{ display: "flex", justifyContent: "center" }}>
            <ArrowLeft size={16} /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
