"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { KeyRound, CheckCircle2, AlertTriangle } from "lucide-react";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setInfo("Compte vérifié avec succès ! Vous pouvez maintenant vous connecter.");
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error.includes("EMAIL_NOT_VERIFIED")) {
        setError(
          "Votre compte n'est pas encore vérifié. Consultez votre email pour activer votre compte."
        );
      } else {
        setError("Email ou mot de passe incorrect.");
      }
    } else {
      router.push("/events");
      router.refresh();
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authBg} />
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authIcon}>
            <KeyRound size={32} color="white" />
          </div>
          <h1 className={styles.authTitle}>Connexion</h1>
          <p className={styles.authSubtitle}>
            Connectez-vous à votre compte ENSAE Events.
          </p>
        </div>

        {info && (
          <div className={styles.alertSuccess} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={16} /> {info}
          </div>
        )}
        
        {error && (
          <div className={styles.alertError} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form className={styles.authForm} onSubmit={handleSubmit} style={{ marginTop: (info || error) ? "20px" : "0" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="prenom.nom@ensae.sn"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Votre mot de passe"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className={styles.authSubmit}
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className={styles.authFooter}>
          Pas encore de compte ?{" "}
          <Link href="/auth/register" className={styles.authLink}>
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}
