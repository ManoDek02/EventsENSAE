"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, Ticket } from "lucide-react";

type EventBookingActionsProps = {
  eventId: string;
  isLoggedIn: boolean;
  loginHref: string;
  deadlinePassed: boolean;
  isSoldOut: boolean;
  registrationOpen: boolean;
  isFree: boolean;
  existingTicketStatus: string | null;
  onWaitlist: boolean;
};

export function EventBookingActions({
  eventId,
  isLoggedIn,
  loginHref,
  deadlinePassed,
  isSoldOut,
  registrationOpen,
  isFree,
  existingTicketStatus,
  onWaitlist,
}: EventBookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReserve = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossible de réserver.");
        return;
      }

      setSuccess(data.message);
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossible de rejoindre la liste d'attente.");
        return;
      }

      setSuccess(data.message);
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (deadlinePassed) {
    return (
      <button className="btn btn-secondary" style={{ width: "100%" }} disabled>
        Inscriptions closes
      </button>
    );
  }

  if (existingTicketStatus) {
    const label =
      existingTicketStatus === "CONFIRMED"
        ? "Billet confirmé"
        : existingTicketStatus === "PENDING"
          ? "En attente de paiement"
          : existingTicketStatus === "SCANNED"
            ? "Billet utilisé"
            : "Billet actif";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px",
            borderRadius: "8px",
            background: "rgba(31, 107, 71, 0.1)",
            color: "var(--color-success)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          {label}
        </div>
        <Link href="/profile/tickets" className="btn btn-primary" style={{ width: "100%" }}>
          <Ticket size={16} />
          Voir mon billet
        </Link>
      </div>
    );
  }

  if (onWaitlist) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px",
          borderRadius: "8px",
          background: "var(--bg-base)",
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
        }}
      >
        <Clock size={18} />
        Vous êtes sur la liste d&apos;attente
      </div>
    );
  }

  if (isSoldOut) {
    if (!isLoggedIn) {
      return (
        <Link href={loginHref} className="btn btn-secondary" style={{ width: "100%" }}>
          Rejoindre la liste d&apos;attente
        </Link>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {error && <p style={{ color: "var(--color-error)", fontSize: "0.85rem" }}>{error}</p>}
        {success && <p style={{ color: "var(--color-success)", fontSize: "0.85rem" }}>{success}</p>}
        <button
          className="btn btn-secondary"
          style={{ width: "100%" }}
          onClick={handleWaitlist}
          disabled={loading}
        >
          {loading ? <Loader2 size={16} /> : null}
          Rejoindre la liste d&apos;attente
        </button>
      </div>
    );
  }

  if (!registrationOpen) return null;

  if (!isLoggedIn) {
    return (
      <Link href={loginHref} className="btn btn-primary" style={{ width: "100%" }}>
        Réserver ma place
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {error && <p style={{ color: "var(--color-error)", fontSize: "0.85rem" }}>{error}</p>}
      {success && <p style={{ color: "var(--color-success)", fontSize: "0.85rem" }}>{success}</p>}
      <button
        className="btn btn-primary"
        style={{ width: "100%" }}
        onClick={handleReserve}
        disabled={loading}
      >
        {loading ? <Loader2 size={16} /> : null}
        {isFree ? "Réserver ma place" : "Réserver et payer"}
      </button>
      {!isFree && (
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>
          Paiement mobile bientôt disponible. Votre billet restera en attente.
        </p>
      )}
    </div>
  );
}
