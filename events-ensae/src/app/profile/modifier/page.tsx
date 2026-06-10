"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Save } from "lucide-react";
import styles from "../profile.module.css";

const FILIERES = [
    "ISEP",
    "AS",
    "ISE",
    "ALUMNI",
    "Autre",
];

const PROMOTIONS = [
    "1ère année",
    "2ème année",
    "3ème année",
    "Autre",
];

export default function ModifierProfilePage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", filiere: "", promotion: "" });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    /* Pré-remplir avec les données actuelles */
    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((data) => {
                setForm({
                    name: data.user?.name ?? "",
                    filiere: data.user?.filiere ?? "",
                    promotion: data.user?.promotion ?? "",
                });
            })
            .catch(() => setError("Impossible de charger vos informations."))
            .finally(() => setFetching(false));
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setSuccess("");
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError("Le nom complet est obligatoire.");
            return;
        }

        setLoading(true);
        setSuccess("");
        setError("");

        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Une erreur est survenue.");
            } else {
                setSuccess("Profil mis à jour avec succès.");
                setTimeout(() => router.push("/profile"), 1200);
            }
        } catch {
            setError("Impossible de contacter le serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* ─── Header ───────────────────────────────────────── */}
            <section className={styles.hero}>
                <div className="container">
                    <div className={styles.heroInner}>
                        <div className={styles.heroInfo}>
                            <h1 className={styles.heroName}>Modifier mon profil</h1>
                            <p className={styles.heroEmail}>
                                Mettez à jour vos informations personnelles
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Formulaire ───────────────────────────────────── */}
            <section className={styles.content}>
                <div className="container">
                    <div style={{ marginBottom: "20px" }}>
                        <Link
                            href="/profile"
                            className="btn btn-ghost btn-sm"
                            style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}
                        >
                            <ArrowLeft size={15} /> Retour au profil
                        </Link>
                    </div>

                    <div className={styles.editCard}>
                        {fetching ? (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                Chargement…
                            </p>
                        ) : (
                            <>
                                {success && (
                                    <div className={`${styles.editAlert} ${styles.editAlertSuccess}`}
                                        style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <CheckCircle2 size={15} /> {success}
                                    </div>
                                )}
                                {error && (
                                    <div className={`${styles.editAlert} ${styles.editAlertError}`}
                                        style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <AlertTriangle size={15} /> {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className={styles.editFieldset}>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="name">
                                                Nom complet <span style={{ color: "var(--color-error)" }}>*</span>
                                            </label>
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
                                            <label className="form-label" htmlFor="filiere">
                                                Filière
                                            </label>
                                            <select
                                                id="filiere"
                                                name="filiere"
                                                className="form-input"
                                                value={form.filiere}
                                                onChange={handleChange}
                                            >
                                                <option value="">— Non renseignée —</option>
                                                {FILIERES.map((f) => (
                                                    <option key={f} value={f}>{f}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="promotion">
                                                Promotion
                                            </label>
                                            <select
                                                id="promotion"
                                                name="promotion"
                                                className="form-input"
                                                value={form.promotion}
                                                onChange={handleChange}
                                            >
                                                <option value="">— Non renseignée —</option>
                                                {PROMOTIONS.map((p) => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>

                                    </div>

                                    <div className={styles.editActions}>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            <Save size={16} />
                                            {loading ? "Enregistrement…" : "Enregistrer les modifications"}
                                        </button>
                                        <Link href="/profile" className="btn btn-secondary">
                                            Annuler
                                        </Link>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}