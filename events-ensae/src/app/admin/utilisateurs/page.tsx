"use client";
// src/app/admin/utilisateurs/page.tsx

import { useEffect, useState, useCallback } from "react";
import {
  Users, Search, CheckCircle2, AlertTriangle,
  UserX, UserCheck, Settings, X, Save,
} from "lucide-react";
import { AdminNav } from "../AdminNav";
import styles from "../admin.module.css";
import { PERMISSION_LABELS, type Permission } from "@/lib/permissions";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  permissions: string[];
  filiere: string | null;
  promotion: string | null;
  emailVerified: string | null;
  createdAt: string;
  _count: { tickets: number; musicSuggestions: number };
};

const ALL_PERMISSIONS = Object.entries(PERMISSION_LABELS) as [Permission, typeof PERMISSION_LABELS[Permission]][];

export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  /* Modal permissions */
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const updateUser = async (id: string, patch: { role?: "STUDENT" | "ADMIN"; disabled?: boolean; permissions?: string[] }) => {
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

  /* Ouvrir le modal permissions */
  const openPermissions = (user: UserItem) => {
    setEditingUser(user);
    setEditPerms([...user.permissions]);
    setError("");
  };

  const togglePerm = (perm: string) => {
    if (perm === "SUPER_ADMIN") {
      // SUPER_ADMIN est exclusif
      setEditPerms(editPerms.includes("SUPER_ADMIN") ? [] : ["SUPER_ADMIN"]);
      return;
    }
    // Si on coche une permission spécifique, retirer SUPER_ADMIN
    const withoutSuper = editPerms.filter((p) => p !== "SUPER_ADMIN");
    if (withoutSuper.includes(perm)) {
      setEditPerms(withoutSuper.filter((p) => p !== perm));
    } else {
      setEditPerms([...withoutSuper, perm]);
    }
  };

  const savePermissions = async () => {
    if (!editingUser) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/utilisateurs/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "ADMIN",
          permissions: editPerms,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Permissions de ${editingUser.name} mises à jour.`);
        setEditingUser(null);
        load();
      } else {
        setError(data.error ?? "Erreur.");
      }
    } catch { setError("Erreur réseau."); }
    finally { setSaving(false); }
  };

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

  const getPermissionSummary = (permissions: string[] | undefined) => {
    if (!permissions || permissions.length === 0) return null;
    if (permissions.includes("SUPER_ADMIN")) return "Super Admin";
    return permissions.map((p) => PERMISSION_LABELS[p as Permission]?.label ?? p).join(", ");
  };

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <div className="container">
          <div className={styles.pageHeaderInner}>
            <div>
              <div className={styles.eyebrow}><Users size={13} /> Gestion</div>
              <h1 className={styles.pageTitle}>Utilisateurs</h1>
              <p className={styles.pageSubtitle}>Gérez les comptes et les accès au back-office.</p>
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
            <input className={styles.searchInput} placeholder="Rechercher par nom ou email…"
              value={q} onChange={(e) => setQ(e.target.value)} />
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
                  <th>Filière / Classe</th>
                  <th>Rôle & Permissions</th>
                  <th>Billets</th>
                  <th>Inscription</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isActive = Boolean(user.emailVerified);
                  const permSummary = getPermissionSummary(user.permissions);

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
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span className={`${styles.badge} ${user.role === "ADMIN" ? styles.badgeBlue : styles.badgeGray}`}>
                            {user.role === "ADMIN" ? "Admin" : "Étudiant"}
                          </span>
                          {permSummary && (
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                              {permSummary}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: "0.85rem", textAlign: "center" }}>{user._count.tickets}</td>
                      <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{formatDate(user.createdAt)}</td>
                      <td>
                        <span className={`${styles.badge} ${isActive ? styles.badgeGreen : styles.badgeRed}`}>
                          {isActive ? "Actif" : "Désactivé"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.tableActions}>

                          {/* Gérer les permissions */}
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Gérer les permissions"
                            onClick={() => openPermissions(user)}
                            style={{ color: "var(--color-accent)" }}
                          >
                            <Settings size={14} />
                          </button>

                          {/* Activer / Désactiver */}
                          {isActive ? (
                            <button className="btn btn-ghost btn-sm" title="Désactiver le compte"
                              onClick={() => {
                                if (confirm(`Désactiver le compte de ${user.name} ?`)) {
                                  updateUser(user.id, { disabled: true });
                                }
                              }}
                              disabled={actionId === user.id}
                              style={{ color: "var(--color-error)" }}>
                              <UserX size={13} />
                            </button>
                          ) : (
                            <button className="btn btn-ghost btn-sm" title="Réactiver le compte"
                              onClick={() => updateUser(user.id, { disabled: false })}
                              disabled={actionId === user.id}
                              style={{ color: "var(--color-success)" }}>
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

      {/* ─── Modal permissions ───────────────────────────────── */}
      {editingUser && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }} onClick={() => setEditingUser(null)}>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-xl)", padding: "28px 32px",
            width: "100%", maxWidth: 520,
            boxShadow: "var(--shadow-lg)",
          }} onClick={(e) => e.stopPropagation()}>

            {/* En-tête */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Permissions de {editingUser.name}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {editingUser.email}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingUser(null)}>
                <X size={16} />
              </button>
            </div>

            {error && <div className={styles.alertError} style={{ marginBottom: 16 }}><AlertTriangle size={14} /> {error}</div>}

            {/* Note */}
            <div style={{
              padding: "10px 14px", background: "var(--color-accent-50)",
              border: "1px solid var(--border-accent)", borderRadius: "var(--radius-md)",
              fontSize: "0.8rem", color: "var(--color-accent-dark)", marginBottom: 20, lineHeight: 1.5,
            }}>
              Cochez les accès à accorder. <strong>Super Administrateur</strong> donne accès à tout et est exclusif avec les autres permissions.
            </div>

            {/* Liste des permissions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {ALL_PERMISSIONS.map(([perm, config]) => {
                const isChecked = editPerms.includes(perm);
                const isDisabled = perm !== "SUPER_ADMIN" && editPerms.includes("SUPER_ADMIN");

                return (
                  <label
                    key={perm}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px",
                      border: `1.5px solid ${isChecked ? "var(--color-accent)" : "var(--border-subtle)"}`,
                      borderRadius: "var(--radius-md)",
                      background: isChecked ? "var(--color-accent-50)" : "var(--bg-base)",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.5 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => togglePerm(perm)}
                      style={{ accentColor: "var(--color-accent)", width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "1.1rem" }}>{config.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                        {config.label}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 1 }}>
                        {config.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={savePermissions}
                disabled={saving}
              >
                <Save size={15} />
                {saving ? "Enregistrement…" : "Sauvegarder les permissions"}
              </button>
              <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}