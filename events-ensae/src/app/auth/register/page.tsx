"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, UserPlus, AlertTriangle } from "lucide-react";
import styles from "../auth.module.css";

const FILIERES = [
  "ISEP",
  "AS",
  "ISE",
  "ALUMNI",
  "Autre",
];

const PROMOTIONS = ["Isep 1", "Isep 2", "AS 1", "AS 2", "AS 3", "ISE Cycle long", "ISE Math", "ISE Eco", "ISE 2", "ISE 3", "Autre"];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    filiere: "",
    promotion: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(true);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          filiere: form.filiere,
          promotion: form.promotion,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setSuccess(true);
        setEmailSent(data.emailSent !== false);
      }
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authBg} />
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.authIcon}>
              <CheckCircle2 size={32} color="white" />
            </div>
            <h1 className={styles.authTitle}>
              {emailSent ? "Vérifiez votre email" : "Compte créé"}
            </h1>
            <p className={styles.authSubtitle}>
              {emailSent
                ? `Un lien de vérification a été envoyé à ${form.email}.`
                : "Votre compte a été créé mais l'email de vérification n'a pas pu être envoyé."}
            </p>
          </div>

          {emailSent ? (
            <div className={styles.alertSuccess} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={16} /> Pensez à vérifier vos spams.
            </div>
          ) : (
            <div className={styles.alertError} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={16} />
              Utilisez &quot;Renvoyer l&apos;email&quot; sur la page de connexion une fois la configuration Resend faite.
            </div>
          )}

          <div className={styles.authFooter} style={{ marginTop: "20px" }}>
            <Link href="/auth/login" className={styles.authLink}>
              Retour à la connexion →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authBg} />
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authIcon}>
            <UserPlus size={32} color="white" />
          </div>
          <h1 className={styles.authTitle}>Créer un compte</h1>
          <p className={styles.authSubtitle}>
            Rejoignez la communauté ENSAE Events pour accéder aux billets, votes musicaux et plus encore.
          </p>
        </div>

        {error && (
          <div className={styles.alertError} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form className={styles.authForm} onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Nom complet</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="Prénom Nom"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="prenom.nom@gmail.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label" htmlFor="filiere">Filière</label>
              <select
                id="filiere"
                name="filiere"
                className="form-input"
                value={form.filiere}
                onChange={handleChange}
              >
                <option value="">Sélectionner</option>
                {FILIERES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="promotion">Classe</label>
              <select
                id="promotion"
                name="promotion"
                className="form-input"
                value={form.promotion}
                onChange={handleChange}
              >
                <option value="">Sélectionner</option>
                {PROMOTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Min. 8 caractères"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirmation</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Répéter"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            className={styles.authSubmit}
            disabled={loading}
          >
            {loading ? "Création en cours..." : "Créer mon compte"}
          </button>
        </form>

        <div className={styles.authFooter}>
          Déjà inscrit(e) ?{" "}
          <Link href="/auth/login" className={styles.authLink}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
