"use client";
// src/app/admin/AdminNav.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Music, Users, LayoutDashboard, Ticket, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./admin.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact: boolean;
  permission?: string; // permission requise (absent = visible par tous les admins)
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/evenements", label: "Événements", icon: Calendar, exact: false, permission: "MANAGE_EVENTS" },
  { href: "/admin/participants", label: "Participants", icon: Ticket, exact: false, permission: "MANAGE_PARTICIPANTS" },
  { href: "/admin/musiques", label: "Musiques", icon: Music, exact: false, permission: "MODERATE_MUSIC" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users, exact: false, permission: "MANAGE_USERS" },
  { href: "/admin/scanner", label: "Scanner QR", icon: QrCode, exact: false, permission: "SCAN_QR" },
];

export function AdminNav() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        setPermissions(data?.user?.permissions ?? []);
      })
      .catch(() => setPermissions([]));
  }, []);

  const canSee = (item: NavItem): boolean => {
    if (!item.permission) return true; // visible par tous les admins
    if (permissions === null) return true; // en chargement, afficher tout
    if (permissions.includes("SUPER_ADMIN")) return true;
    return permissions.includes(item.permission);
  };

  return (
    <nav className={styles.adminNav}>
      {NAV_ITEMS.filter(canSee).map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.adminNavItem} ${isActive ? styles.adminNavItemActive : ""}`}
          >
            <Icon size={15} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}