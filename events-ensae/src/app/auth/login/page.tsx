"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { KeyRound, CheckCircle2, AlertTriangle, Mail } from "lucide-react";
import styles from "../auth.module.css";

function getSignInErrorCode(result: { error?: string | null; url?: string | null }) {
  if (result.url) {
    try {
      const code = new URL(result.url).searchParams.get("code");
      if (code) return code;
    } catch {
      // ignore invalid URL
    }
  }
  return null;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showResend, setShowResend] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/events";

  const verifiedInfo =
    searchParams.get("verified") === "true"
      ? "Compte vérifié avec succès ! Vous pouvez maintenant vous connecter."
      : "";

  const urlErrorCode = searchParams.get("code");
  const urlUnverifiedHint =
    urlErrorCode === "email_not_verified"
      ? "Votre compte n'est pas encore vérifié. Consultez votre email pour activer votre compte."
      : "";

  const displayInfo = info || verifiedInfo;
  const displayError =
    error ||
    (urlErrorCode === "email_not_verified" && !error ? urlUnverifiedHint : "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setShowResend(false);
  };

  const handleResend = async () => {
    if (!form.email) {
      setError("Saisissez votre email pour renvoyer le lien de vérification.");
      return;
    }

    setResending(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossible de renvoyer l'email.");
      } else {
        setInfo(data.message ?? "Email de vérification renvoyé.");
        setShowResend(false);
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    setShowResend(false);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      const code = getSignInErrorCode(result);

      if (code === "email_not_verified") {
        setError(
          "Votre compte n'est pas encore vérifié. Consultez votre email pour activer votre compte."
        );
        setShowResend(true);
      } else {
        setError("Email ou mot de passe incorrect.");
      }
    } else {
      router.push(callbackUrl.startsWith("/") ? callbackUrl : "/events");
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

        {displayInfo && (
          <div
            className={styles.alertSuccess}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <CheckCircle2 size={16} /> {displayInfo}
          </div>
        )}

        {displayError && (
          <div
            className={styles.alertError}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <AlertTriangle size={16} /> {displayError}
          </div>
        )}

        {(showResend || urlErrorCode === "email_not_verified") && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: "100%", marginTop: displayError ? "12px" : "0" }}
            onClick={handleResend}
            disabled={resending}
          >
            <Mail size={16} />
            {resending ? "Envoi..." : "Renvoyer l'email de vérification"}
          </button>
        )}

        <form
          className={styles.authForm}
          onSubmit={handleSubmit}
          style={{ marginTop: displayInfo || displayError || showResend ? "20px" : "0" }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
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
            <label className="form-label" htmlFor="password">
              Mot de passe
            </label>
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
