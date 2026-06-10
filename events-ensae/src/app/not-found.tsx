// src/app/not-found.tsx
import Link from "next/link";
import { Calendar, Home, Search, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      background: "var(--bg-base)",
      textAlign: "center",
      paddingTop: "calc(var(--navbar-height) + 40px)",
    }}>

      {/* Numéro 404 */}
      <div style={{
        fontSize: "clamp(6rem, 20vw, 10rem)",
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "-0.06em",
        color: "var(--border-medium)",
        marginBottom: "8px",
        userSelect: "none",
        fontFamily: "var(--font-heading)",
      }}>
        404
      </div>

      {/* Point accent */}
      <div style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "var(--color-accent)",
        margin: "0 auto 28px",
      }} />

      <h1 style={{
        fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
        fontWeight: 700,
        letterSpacing: "-0.025em",
        color: "var(--text-primary)",
        marginBottom: "12px",
      }}>
        Page introuvable
      </h1>

      <p style={{
        fontSize: "0.9375rem",
        color: "var(--text-secondary)",
        maxWidth: "380px",
        lineHeight: 1.7,
        marginBottom: "40px",
      }}>
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
        Revenez à l&apos;accueil ou explorez les événements.
      </p>

      {/* Actions principales */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "48px" }}>
        <Link href="/" className="btn btn-primary">
          <Home size={16} /> Accueil
        </Link>
        <Link href="/events" className="btn btn-secondary">
          <Calendar size={16} /> Événements
        </Link>
      </div>

      {/* Liens rapides */}
      <div style={{
        padding: "20px 24px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        maxWidth: "380px",
        width: "100%",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "12px",
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
        }}>
          <Search size={12} /> Liens utiles
        </div>

        {[
          { href: "/events", label: "Liste des événements", icon: Calendar },
          { href: "/profile/tickets", label: "Mes billets", icon: ArrowRight },
          { href: "/auth/login", label: "Connexion", icon: ArrowRight },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="not-found-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 0",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              borderBottom: "1px solid var(--border-subtle)",
              textDecoration: "none",
              transition: "color var(--transition-fast)",
            }}
          >
            <link.icon size={15} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
            {link.label}
          </Link>
        ))}
      </div>

      <style>{`
        .not-found-link:hover {
          color: var(--color-accent) !important;
        }
        .not-found-link:last-child {
          border-bottom: none !important;
        }
      `}</style>
    </div>
  );
}