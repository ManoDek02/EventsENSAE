"use client";
// src/app/admin/utilisateurs/page.tsx

import { useEffect, useState, useCallback } from "react";
import {
    Users, Search, CheckCircle2, AlertTriangle,
    ShieldCheck, ShieldOff, UserX, UserCheck,
} from "lucide-react";
import { AdminNav } from "../AdminNav";
import styles from "../admin.module.css";

type UserItem = {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "ADMIN";
    filiere: string | null;
    promotion: string | null;
    emailVerified: string | null;
    createdAt: string;
    _count: { tickets: number; musicSuggestions: number };
};

export default function AdminUtilisateursPage() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [actionId, setActionId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set("q", q.trim());
            if (roleFilter) params.set("role", roleFilter);
            const res = await fetch(`/api/admin/utilisateurs?${params.toString()}`);
            const data = await res.json();
            setUsers(data.users ?? []);
        } catch {
            setError("Impossible de charger les utilisateurs.");
        } finally {
            setLoading(false);
        }
    }, [q, roleFilter]);

    /* Debounce recherche */
    useEffect(() => {
        const t = setTimeout(() => load(), 300);
        return () => clearTimeout(t);
    }, [load]);

    const updateUser = async (id: string, patch: { role?: "STUDENT" | "ADMIN"; disabled?: boolean }) => {
        setActionId(id); setSuccess(""); setError("");
        const res = await fetch(`/api/admin/utilisateurs/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (res.ok) { setSuccess(data.message); load(); }
        else setError(data.error ?? "Erreur lors de la mise à jour.");
        setActionId(null);
    };

    const formatDate = (d: string) =>
        new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <div className={styles.pageHeaderInner}>
                        <div>
                            <div className={styles.eyebrow}><Users size={13} /> Gestion</div>
                            <h1 className={styles.pageTitle}>Utilisateurs</h1>
                            <p className={styles.pageSubtitle}>Gérez les comptes étudiants et les droits d&apos;accès.</p>
                        </div>
                        <div className={styles.pageActions}>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                {users.length} utilisateur{users.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <AdminNav />

                {success && <div className={styles.alertSuccess}><CheckCircle2 size={15} /> {success}</div>}
                {error && <div className={styles.alertError}><AlertTriangle size={15} /> {error}</div>}

                <div className={styles.toolbar}>
                    <div className={styles.searchWrap}>
                        <Search size={15} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Rechercher par nom ou email…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                    <select className={styles.filterSelect} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">Tous les rôles</option>
                        <option value="STUDENT">Étudiants</option>
                        <option value="ADMIN">Administrateurs</option>
                    </select>
                </div>

                {loading ? (
                    <p style={{ color: "var(--text-muted)", padding: "32px 0" }}>Chargement…</p>
                ) : users.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}><Users size={24} /></div>
                        <p className={styles.emptyText}>Aucun utilisateur trouvé.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Utilisateur</th>
                                    <th>Filière / Promo</th>
                                    <th>Rôle</th>
                                    <th>Billets</th>
                                    <th>Musiques</th>
                                    <th>Inscription</th>
                                    <th>Compte</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => {
                                    const isActive = Boolean(user.emailVerified);
                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <div className={styles.tableName}>{user.name}</div>
                                                <div className={styles.tableSub}>{user.email}</div>
                                            </td>
                                            <td style={{ fontSize: "0.82rem" }}>
                                                {[user.filiere, user.promotion].filter(Boolean).join(" · ") || (
                                                    <span style={{ color: "var(--text-muted)" }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${user.role === "ADMIN" ? styles.badgeBlue : styles.badgeGray}`}>
                                                    {user.role === "ADMIN" ? "Admin" : "Étudiant"}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: "0.85rem", textAlign: "center" }}>{user._count.tickets}</td>
                                            <td style={{ fontSize: "0.85rem", textAlign: "center" }}>{user._count.musicSuggestions}</td>
                                            <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{formatDate(user.createdAt)}</td>
                                            <td>
                                                <span className={`${styles.badge} ${isActive ? styles.badgeGreen : styles.badgeRed}`}>
                                                    {isActive ? "Actif" : "Désactivé"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.tableActions}>
                                                    {/* Changer rôle */}
                                                    {user.role === "STUDENT" ? (
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            title="Passer administrateur"
                                                            onClick={() => {
                                                                if (confirm(`Passer ${user.name} administrateur ? Il/elle aura accès au back-office.`)) {
                                                                    updateUser(user.id, { role: "ADMIN" });
                                                                }
                                                            }}
                                                            disabled={actionId === user.id}
                                                            style={{ fontSize: "0.75rem" }}
                                                        >
                                                            <ShieldCheck size={13} /> Admin
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            title="Rétrograder étudiant"
                                                            onClick={() => {
                                                                if (confirm(`Rétrograder ${user.name} en étudiant ?`)) {
                                                                    updateUser(user.id, { role: "STUDENT" });
                                                                }
                                                            }}
                                                            disabled={actionId === user.id}
                                                            style={{ fontSize: "0.75rem", color: "var(--color-warning)" }}
                                                        >
                                                            <ShieldOff size={13} /> Rétrograder
                                                        </button>
                                                    )}

                                                    {/* Activer / Désactiver */}
                                                    {isActive ? (
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            title="Désactiver le compte"
                                                            onClick={() => {
                                                                if (confirm(`Désactiver le compte de ${user.name} ? Il/elle ne pourra plus se connecter.`)) {
                                                                    updateUser(user.id, { disabled: true });
                                                                }
                                                            }}
                                                            disabled={actionId === user.id}
                                                            style={{ fontSize: "0.75rem", color: "var(--color-error)" }}
                                                        >
                                                            <UserX size={13} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            title="Réactiver le compte"
                                                            onClick={() => updateUser(user.id, { disabled: false })}
                                                            disabled={actionId === user.id}
                                                            style={{ fontSize: "0.75rem", color: "var(--color-success)" }}
                                                        >
                                                            <UserCheck size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}