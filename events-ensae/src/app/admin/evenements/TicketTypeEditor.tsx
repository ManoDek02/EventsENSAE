"use client";
// src/app/admin/evenements/TicketTypeEditor.tsx

import { useState } from "react";
import { Plus, Trash2, Tag, AlertTriangle } from "lucide-react";
import styles from "../admin.module.css";

export type TicketTypeInput = {
    id?: string;
    name: string;
    description: string;
    price: string;
    seats: string;   // ← NOUVEAU
};

type Props = {
    eventId?: string;
    value: TicketTypeInput[];
    onChange: (types: TicketTypeInput[]) => void;
};

export function TicketTypeEditor({ value, onChange }: Props) {
    const [error, setError] = useState("");

    const add = () => {
        onChange([...value, { name: "", description: "", price: "0", seats: "1" }]);
    };

    const remove = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const update = (index: number, field: keyof TicketTypeInput, val: string) => {
        const updated = value.map((t, i) =>
            i === index ? { ...t, [field]: val } : t
        );
        onChange(updated);
        setError("");
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Tag size={15} color="var(--color-accent)" />
                    <span className="form-label" style={{ margin: 0 }}>Types de billets</span>
                    {value.length > 0 && (
                        <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--color-accent-100)", color: "var(--color-accent-dark)", fontSize: "0.72rem", fontWeight: 700 }}>
                            {value.length}
                        </span>
                    )}
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={add}>
                    <Plus size={14} /> Ajouter un type
                </button>
            </div>

            {value.length === 0 ? (
                <div style={{ padding: "16px 20px", background: "var(--bg-base)", border: "1px dashed var(--border-medium)", borderRadius: "var(--radius-md)", fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
                    Aucun type défini — le prix unique de l&apos;événement s&apos;applique.
                    <br />
                    Ajoutez des types pour proposer plusieurs tarifs (Couple, Single, ENSAE, hors ENSAE…).
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {value.map((type, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: 10, padding: "14px 16px", background: "var(--bg-base)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", alignItems: "start" }}>

                            {/* Nom */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: "0.75rem" }}>
                                    Nom <span style={{ color: "var(--color-error)" }}>*</span>
                                </label>
                                <input className="form-input" style={{ fontSize: "0.875rem", padding: "7px 12px" }}
                                    placeholder="ex: Couple ENSAE"
                                    value={type.name} onChange={(e) => update(i, "name", e.target.value)} required />
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: "0.75rem" }}>Description</label>
                                <input className="form-input" style={{ fontSize: "0.875rem", padding: "7px 12px" }}
                                    placeholder="ex: Pour les couples étudiants ENSAE"
                                    value={type.description} onChange={(e) => update(i, "description", e.target.value)} />
                            </div>

                            {/* Prix */}
                            <div className="form-group" style={{ minWidth: 100 }}>
                                <label className="form-label" style={{ fontSize: "0.75rem" }}>Prix (FCFA)</label>
                                <input className="form-input" style={{ fontSize: "0.875rem", padding: "7px 12px" }}
                                    type="number" min="0" placeholder="25000"
                                    value={type.price} onChange={(e) => update(i, "price", e.target.value)} />
                            </div>

                            {/* Places — NOUVEAU */}
                            <div className="form-group" style={{ minWidth: 80 }}>
                                <label className="form-label" style={{ fontSize: "0.75rem" }}>
                                    Places
                                    <span style={{ display: "block", fontWeight: 400, color: "var(--text-muted)", fontSize: "0.68rem", lineHeight: 1.3 }}>
                                        (1 = Single<br />2 = Couple)
                                    </span>
                                </label>
                                <input className="form-input" style={{ fontSize: "0.875rem", padding: "7px 12px" }}
                                    type="number" min="1" max="10"
                                    value={type.seats} onChange={(e) => update(i, "seats", e.target.value)} />
                            </div>

                            {/* Supprimer */}
                            <div style={{ paddingTop: 22 }}>
                                <button type="button" className="btn btn-ghost btn-sm"
                                    style={{ color: "var(--color-error)", padding: "7px 10px" }}
                                    onClick={() => remove(i)} title="Supprimer">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className={styles.alertError} style={{ marginTop: 10 }}>
                    <AlertTriangle size={14} /> {error}
                </div>
            )}
        </div>
    );
}