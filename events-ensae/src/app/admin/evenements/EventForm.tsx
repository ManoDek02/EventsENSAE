"use client";
// src/app/admin/evenements/EventForm.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import styles from "../admin.module.css";

export type EventFormData = {
    title: string;
    description: string;
    category: string;
    date: string;
    location: string;
    imageUrl: string;
    price: string;
    capacity: string;
    deadline: string;
    published: boolean;
    tags: string;
    allowsMusicSuggestions: boolean;
};

type Props = {
    initialData?: Partial<EventFormData>;
    eventId?: string;
};

const EMPTY: EventFormData = {
    title: "", description: "", category: "AUTRE",
    date: "", location: "", imageUrl: "", price: "0",
    capacity: "100", deadline: "", published: false,
    tags: "", allowsMusicSuggestions: false,
};

const CATEGORIES = [
    { value: "GALA", label: "Dîner de Gala" },
    { value: "CHAMPIONNAT", label: "Championnat sportif" },
    { value: "SORTIE_PEDAGOGIQUE", label: "Sortie pédagogique" },
    { value: "CONFERENCE", label: "Conférence" },
    { value: "AUTRE", label: "Autre" },
];

export function EventForm({ initialData, eventId }: Props) {
    const router = useRouter();
    const isEdit = Boolean(eventId);

    const [form, setForm] = useState<EventFormData>({ ...EMPTY, ...initialData });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const set = (k: keyof EventFormData, v: string | boolean) =>
        setForm((prev) => ({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setSuccess(""); setError("");

        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            date: form.date,
            location: form.location.trim(),
            imageUrl: form.imageUrl.trim() || null,
            price: Number(form.price) || 0,
            capacity: Number(form.capacity),
            deadline: form.deadline || null,
            published: form.published,
            tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
            allowsMusicSuggestions: form.allowsMusicSuggestions,
        };

        try {
            const url = isEdit ? `/api/admin/events/${eventId}` : "/api/admin/events";
            const method = isEdit ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Une erreur est survenue.");
            } else {
                setSuccess(isEdit ? "Événement mis à jour." : "Événement créé avec succès.");
                if (!isEdit) {
                    setTimeout(() => router.push(`/admin/evenements/${data.event.id}`), 800);
                }
            }
        } catch {
            setError("Impossible de contacter le serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Link href="/admin/evenements" className="btn btn-ghost btn-sm"
                    style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <ArrowLeft size={14} /> Retour aux événements
                </Link>
            </div>

            {success && <div className={styles.alertSuccess}><CheckCircle2 size={15} /> {success}</div>}
            {error && <div className={styles.alertError}><AlertTriangle size={15} /> {error}</div>}

            <div className={styles.formCard}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGrid}>

                        {/* Titre */}
                        <div className={`form-group ${styles.formGridFull}`}>
                            <label className="form-label" htmlFor="title">
                                Titre <span style={{ color: "var(--color-error)" }}>*</span>
                            </label>
                            <input id="title" className="form-input" required
                                value={form.title} onChange={(e) => set("title", e.target.value)}
                                placeholder="Ex. Dîner de Gala ENSAE 2027" />
                        </div>

                        {/* Description */}
                        <div className={`form-group ${styles.formGridFull}`}>
                            <label className="form-label" htmlFor="description">
                                Description <span style={{ color: "var(--color-error)" }}>*</span>
                            </label>
                            <textarea id="description" className="form-input" required rows={4}
                                value={form.description} onChange={(e) => set("description", e.target.value)}
                                placeholder="Description complète de l'événement…"
                                style={{ resize: "vertical" }} />
                        </div>

                        {/* Image upload */}
                        <div className={`form-group ${styles.formGridFull}`}>
                            <ImageUpload
                                value={form.imageUrl}
                                onChange={(url) => set("imageUrl", url)}
                                label="Image de l'événement"
                            />
                        </div>

                        {/* Catégorie */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="category">Catégorie *</label>
                            <select id="category" className="form-input" required
                                value={form.category} onChange={(e) => set("category", e.target.value)}>
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Lieu */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="location">Lieu *</label>
                            <input id="location" className="form-input" required
                                value={form.location} onChange={(e) => set("location", e.target.value)}
                                placeholder="King Fahd Palace, Dakar" />
                        </div>

                        {/* Date */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="date">Date et heure *</label>
                            <input id="date" type="datetime-local" className="form-input" required
                                value={form.date} onChange={(e) => set("date", e.target.value)} />
                        </div>

                        {/* Deadline */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="deadline">Clôture des inscriptions</label>
                            <input id="deadline" type="datetime-local" className="form-input"
                                value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
                        </div>

                        {/* Prix */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="price">Prix (FCFA)</label>
                            <input id="price" type="number" min="0" className="form-input"
                                value={form.price} onChange={(e) => set("price", e.target.value)}
                                placeholder="0 = Gratuit" />
                        </div>

                        {/* Capacité */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="capacity">Capacité (places) *</label>
                            <input id="capacity" type="number" min="1" className="form-input" required
                                value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
                        </div>

                        {/* Tags */}
                        <div className={`form-group ${styles.formGridFull}`}>
                            <label className="form-label" htmlFor="tags">Tags (séparés par des virgules)</label>
                            <input id="tags" className="form-input"
                                value={form.tags} onChange={(e) => set("tags", e.target.value)}
                                placeholder="gala, alumni, soirée" />
                        </div>

                        {/* Options */}
                        <div className={`form-group ${styles.formGridFull}`}
                            style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.9rem" }}>
                                <input type="checkbox" checked={form.published}
                                    onChange={(e) => set("published", e.target.checked)} />
                                Publier immédiatement
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.9rem" }}>
                                <input type="checkbox" checked={form.allowsMusicSuggestions}
                                    onChange={(e) => set("allowsMusicSuggestions", e.target.checked)} />
                                Activer la playlist communautaire
                            </label>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Save size={16} />
                            {loading ? "Enregistrement…" : isEdit ? "Sauvegarder les modifications" : "Créer l'événement"}
                        </button>
                        <Link href="/admin/evenements" className="btn btn-secondary">Annuler</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}