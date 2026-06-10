"use client";
// src/app/error.tsx
// Affiché quand une Server Component lève une erreur non gérée

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ERROR BOUNDARY]", error);
  }, [error]);

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
    }}>

      {/* Icône */}
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "16px",
        background: "rgba(220, 38, 38, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-error)",
        marginBottom: "24px",
      }}>
        <AlertTriangle size={28} />
      </div>

      <h1 style={{
        fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
        fontWeight: 700,
        letterSpacing: "-0.025em",
        color: "var(--text-primary)",
        marginBottom: "12px",
      }}>
        Une erreur est survenue
      </h1>

      <p style={{
        fontSize: "0.9375rem",
        color: "var(--text-secondary)",
        maxWidth: "400px",
        lineHeight: 1.7,
        marginBottom: "32px",
      }}>
        Quelque chose s&apos;est mal passé. L&apos;équipe a été notifiée.
        Vous pouvez réessayer ou revenir à l&apos;accueil.
      </p>

      {/* Détail technique (dev uniquement) */}
      {process.env.NODE_ENV === "development" && error.message && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(220, 38, 38, 0.05)",
          border: "1px solid rgba(220, 38, 38, 0.15)",
          borderRadius: "8px",
          marginBottom: "32px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "left",
        }}>
          <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-error)", wordBreak: "break-word" }}>
            {error.message}
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "6px" }}>
              Digest: {error.digest}
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={reset}>
          <RefreshCw size={15} /> Réessayer
        </button>
        <Link href="/" className="btn btn-secondary">
          <Home size={15} /> Accueil
        </Link>
      </div>
    </div>
  );
}