// src/lib/permissions.ts
// Système de permissions granulaires ENSAE Events

/* ─── Définition des permissions ────────────────────────────── */
export const PERMISSIONS = {
  SUPER_ADMIN:         "SUPER_ADMIN",         // Accès complet à tout
  MANAGE_EVENTS:       "MANAGE_EVENTS",       // Créer, modifier, publier des événements
  MANAGE_PARTICIPANTS: "MANAGE_PARTICIPANTS", // Inscrits, paiements, export CSV
  SCAN_QR:             "SCAN_QR",             // Accès uniquement au scanner QR
  MODERATE_MUSIC:      "MODERATE_MUSIC",      // Approuver/refuser les suggestions musicales
  MANAGE_USERS:        "MANAGE_USERS",        // Modifier rôles, activer/désactiver comptes
} as const;

export type Permission = keyof typeof PERMISSIONS;

/* ─── Labels lisibles ────────────────────────────────────────── */
export const PERMISSION_LABELS: Record<Permission, { label: string; desc: string; icon: string }> = {
  SUPER_ADMIN:         { label: "Super Administrateur", desc: "Accès complet à toutes les fonctionnalités", icon: "⭐" },
  MANAGE_EVENTS:       { label: "Gestion des événements", desc: "Créer, modifier et publier des événements", icon: "📅" },
  MANAGE_PARTICIPANTS: { label: "Gestion des participants", desc: "Voir les inscrits, confirmer les paiements, exporter CSV", icon: "🎫" },
  SCAN_QR:             { label: "Scanner QR", desc: "Accès au scanner de billets à l'entrée", icon: "📷" },
  MODERATE_MUSIC:      { label: "Modération musicale", desc: "Approuver ou refuser les suggestions musicales", icon: "🎵" },
  MANAGE_USERS:        { label: "Gestion des utilisateurs", desc: "Modifier les rôles et désactiver des comptes", icon: "👥" },
};

/* ─── Mapping permission → routes admin accessibles ─────────── */
export const PERMISSION_ROUTES: Record<Permission, string[]> = {
  SUPER_ADMIN:         ["/admin"],
  MANAGE_EVENTS:       ["/admin/evenements"],
  MANAGE_PARTICIPANTS: ["/admin/participants"],
  SCAN_QR:             ["/admin/scanner"],
  MODERATE_MUSIC:      ["/admin/musiques"],
  MANAGE_USERS:        ["/admin/utilisateurs"],
};

/* ─── Vérifier si un utilisateur a une permission ───────────── */
export function hasPermission(
  permissions: string[],
  required: Permission
): boolean {
  // SUPER_ADMIN a accès à tout
  if (permissions.includes(PERMISSIONS.SUPER_ADMIN)) return true;
  return permissions.includes(PERMISSIONS[required]);
}

/* ─── Vérifier si l'utilisateur a accès à une route admin ────── */
export function canAccessRoute(
  permissions: string[],
  pathname: string
): boolean {
  if (permissions.includes(PERMISSIONS.SUPER_ADMIN)) return true;

  return Object.entries(PERMISSION_ROUTES).some(([perm, routes]) => {
    if (!permissions.includes(perm)) return false;
    return routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  });
}

/* ─── Obtenir les routes accessibles pour un utilisateur ─────── */
export function getAccessibleRoutes(permissions: string[]): string[] {
  if (permissions.includes(PERMISSIONS.SUPER_ADMIN)) {
    return ["/admin"];
  }
  const routes = new Set<string>();
  Object.entries(PERMISSION_ROUTES).forEach(([perm, permsRoutes]) => {
    if (permissions.includes(perm)) {
      permsRoutes.forEach((r) => routes.add(r));
    }
  });
  return Array.from(routes);
}