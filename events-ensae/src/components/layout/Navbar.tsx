"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  Music,
  User,
  Settings,
  LogOut,
  Ticket,
  LucideIcon,
} from "lucide-react";
import styles from "./Navbar.module.css";

type NavLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/events", label: "Événements" },
];

const AUTH_NAV_LINKS: NavLink[] = [
  { href: "/music", label: "Musiques", icon: Music },
  { href: "/profile", label: "Mon Profil", icon: User },
];

const ADMIN_NAV_LINKS: NavLink[] = [
  { href: "/admin", label: "Administration", icon: Settings },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = session?.user.role === "ADMIN";
  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const allLinks = [
    ...NAV_LINKS,
    ...(session ? AUTH_NAV_LINKS : []),
    ...(isAdmin ? ADMIN_NAV_LINKS : []),
  ];

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.navInner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <GraduationCap size={20} color="white" />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>ENSAE Events</span>
            <span className={styles.logoSub}>Dakar, Sénégal</span>
          </div>
        </Link>

        {/* Navigation links */}
        <ul className={styles.navLinks}>
          {allLinks.map((link) => {
            const Icon = link.icon;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.active : ""}`}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {Icon && <Icon size={16} />}
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Actions */}
        <div className={styles.navActions}>
          {session ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <div
                className={styles.userAvatar}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title={session.user?.name ?? ""}
              >
                {userInitials}
              </div>
              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownUser}>
                    <div className={styles.dropdownUserName}>{session.user?.name}</div>
                    <div className={styles.dropdownUserEmail}>{session.user?.email}</div>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link href="/profile" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                    <User size={16} /> Mon Profil
                  </Link>
                  <Link href="/profile/tickets" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                    <Ticket size={16} /> Mes Billets
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                      <Settings size={16} /> Administration
                    </Link>
                  )}
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.danger}`}
                    onClick={() => signOut({ redirectTo: "/" })}
                  >
                    <LogOut size={16} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">
                Connexion
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
