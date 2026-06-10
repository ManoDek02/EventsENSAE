"use client";
// src/app/admin/AdminNav.tsx  (version mise à jour — ajouter QrCode dans les imports)

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Music, Users, LayoutDashboard, Ticket, QrCode } from "lucide-react";
import styles from "./admin.module.css";

const NAV_ITEMS = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { href: "/admin/evenements", label: "Événements", icon: Calendar, exact: false },
    { href: "/admin/participants", label: "Participants", icon: Ticket, exact: false },
    { href: "/admin/musiques", label: "Musiques", icon: Music, exact: false },
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users, exact: false },
    { href: "/admin/scanner", label: "Scanner QR", icon: QrCode, exact: false },
];

export function AdminNav() {
    const pathname = usePathname();

    return (
        <nav className={styles.adminNav}>
            {NAV_ITEMS.map((item) => {
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