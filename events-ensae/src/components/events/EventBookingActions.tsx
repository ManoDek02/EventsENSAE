"use client";
// src/components/events/EventBookingActions.tsx

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, Ticket, Tag } from "lucide-react";
import { PaymentInstructions } from "@/components/payment/PaymentInstructions";

type TicketType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
};

type EventBookingActionsProps = {
  eventId: string;
  isLoggedIn: boolean;
  loginHref: string;
  deadlinePassed: boolean;
  isSoldOut: boolean;
  registrationOpen: boolean;
  isFree: boolean;
  price: number;
  eventTitle: string;
  userName: string;
  existingTicketStatus: string | null;
  existingTicketId: string | null;
  existingTicketCode: string | null;
  existingTicketTypeName: string | null;
  onWaitlist: boolean;
  ticketTypes: TicketType[];
};

export function EventBookingActions({
  eventId, isLoggedIn, loginHref, deadlinePassed, isSoldOut,
  registrationOpen, isFree, price, eventTitle, userName,
  existingTicketStatus, existingTicketId, existingTicketCode,
  existingTicketTypeName, onWaitlist, ticketTypes,
}: EventBookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    ticketTypes.length > 0 ? ticketTypes[0].id : ""
  );
  const [newTicket, setNewTicket] = useState<{ id: string; code: string; price: number } | null>(null);

  const selectedType = ticketTypes.find((t) => t.id === selectedTypeId);
  const effectivePrice = ticketTypes.length > 0
    ? (selectedType?.price ?? 0)
    : price;
  const effectiveIsFree = effectivePrice === 0;

  const handleReserve = async () => {
    setLoading(true); setError(""); setSuccess("");

    try {
      const body: { eventId: string; ticketTypeId?: string } = { eventId };
      if (ticketTypes.length > 0 && selectedTypeId) {
        body.ticketTypeId = selectedTypeId;
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossible de réserver.");
        return;
      }

      if (data.ticket.status === "CONFIRMED") {
        setSuccess(data.message);
        router.refresh();
      } else {
        setNewTicket({
          id: data.ticket.id,
          code: data.ticket.qrCode,
          price: data.ticket.price ?? effectivePrice,
        });
        router.refresh();
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Impossible de rejoindre la liste d'attente."); return; }
      setSuccess(data.message);
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Inscriptions closes ─────────────────────────────────── */
  if (deadlinePassed) {
    return (
      <button className="btn btn-secondary" style={{ width: "100%" }} disabled>
        Inscriptions closes
      </button>
    );
  }

  /* ── Billet existant ─────────────────────────────────────── */
  if (existingTicketStatus) {
    if (
      (existingTicketStatus === "PENDING" || existingTicketStatus === "PENDING_REVIEW") &&
      !effectiveIsFree && existingTicketId && existingTicketCode
    ) {
      return (
        <PaymentInstructions
          ticketId={existingTicketId}
          ticketCode={existingTicketCode}
          eventTitle={existingTicketTypeName
            ? `${eventTitle} — ${existingTicketTypeName}`
            : eventTitle}
          amount={effectivePrice}
          userName={userName}
          alreadyNotified={existingTicketStatus === "PENDING_REVIEW"}
        />
      );
    }

    const label = existingTicketStatus === "CONFIRMED" ? "Billet confirmé"
      : existingTicketStatus === "PENDING_REVIEW" ? "Paiement en cours de vérification"
        : existingTicketStatus === "SCANNED" ? "Billet utilisé"
          : "Billet actif";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "12px", borderRadius: "8px",
          background: existingTicketStatus === "PENDING_REVIEW"
            ? "rgba(217,119,6,0.1)" : "rgba(22,163,74,0.1)",
          color: existingTicketStatus === "PENDING_REVIEW"
            ? "var(--color-warning)" : "var(--color-success)",
          fontSize: "0.9rem", fontWeight: 600,
        }}>
          <CheckCircle2 size={18} />
          {label}
          {existingTicketTypeName && (
            <span style={{ fontWeight: 400, marginLeft: 4, fontSize: "0.82rem" }}>
              — {existingTicketTypeName}
            </span>
          )}
        </div>
        <Link href="/profile/tickets" className="btn btn-primary" style={{ width: "100%" }}>
          <Ticket size={16} /> Voir mon billet
        </Link>
      </div>
    );
  }

  /* ── Vient de réserver (payant) ──────────────────────────── */
  if (newTicket) {
    return (
      <PaymentInstructions
        ticketId={newTicket.id}
        ticketCode={newTicket.code}
        eventTitle={selectedType ? `${eventTitle} — ${selectedType.name}` : eventTitle}
        amount={newTicket.price}
        userName={userName}
      />
    );
  }

  /* ── Liste d'attente ─────────────────────────────────────── */
  if (onWaitlist) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: "8px", padding: "12px",
        borderRadius: "8px", background: "var(--bg-base)",
        color: "var(--text-secondary)", fontSize: "0.9rem",
      }}>
        <Clock size={18} /> Vous êtes sur la liste d&apos;attente
      </div>
    );
  }

  /* ── Complet ─────────────────────────────────────────────── */
  if (isSoldOut) {
    if (!isLoggedIn) return (
      <Link href={loginHref} className="btn btn-secondary" style={{ width: "100%" }}>
        Rejoindre la liste d&apos;attente
      </Link>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {error && <p style={{ color: "var(--color-error)", fontSize: "0.85rem" }}>{error}</p>}
        {success && <p style={{ color: "var(--color-success)", fontSize: "0.85rem" }}>{success}</p>}
        <button className="btn btn-secondary" style={{ width: "100%" }}
          onClick={handleWaitlist} disabled={loading}>
          {loading && <Loader2 size={16} />} Rejoindre la liste d&apos;attente
        </button>
      </div>
    );
  }

  if (!registrationOpen) return null;

  /* ── Non connecté ────────────────────────────────────────── */
  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {ticketTypes.length > 0 && (
          <TicketTypeSelector
            types={ticketTypes}
            selectedId={selectedTypeId}
            onChange={setSelectedTypeId}
          />
        )}
        <Link href={loginHref} className="btn btn-primary" style={{ width: "100%" }}>
          Réserver ma place
        </Link>
      </div>
    );
  }

  /* ── Réservation disponible ──────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {error && <p style={{ color: "var(--color-error)", fontSize: "0.85rem" }}>{error}</p>}
      {success && <p style={{ color: "var(--color-success)", fontSize: "0.85rem" }}>{success}</p>}

      {/* Sélecteur de type */}
      {ticketTypes.length > 0 && (
        <TicketTypeSelector
          types={ticketTypes}
          selectedId={selectedTypeId}
          onChange={setSelectedTypeId}
        />
      )}

      <button className="btn btn-primary" style={{ width: "100%" }}
        onClick={handleReserve} disabled={loading}>
        {loading && <Loader2 size={16} />}
        {effectiveIsFree
          ? "Réserver ma place"
          : `Réserver — ${effectivePrice.toLocaleString("fr-FR")} FCFA`}
      </button>

      {!effectiveIsFree && (
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>
          Paiement par Wave ou Orange Money après réservation.
        </p>
      )}
    </div>
  );
}

/* ─── Composant sélecteur de type ────────────────────────────── */
function TicketTypeSelector({
  types, selectedId, onChange,
}: {
  types: TicketType[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{
        fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)",
        display: "flex", alignItems: "center", gap: "5px",
      }}>
        <Tag size={13} /> Type de billet
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {types.map((type) => (
          <label
            key={type.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px",
              border: `1.5px solid ${selectedId === type.id ? "var(--color-accent)" : "var(--border-medium)"}`,
              borderRadius: "var(--radius-md)",
              background: selectedId === type.id ? "var(--color-accent-50)" : "var(--bg-surface)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="radio"
                name="ticketType"
                value={type.id}
                checked={selectedId === type.id}
                onChange={() => onChange(type.id)}
                style={{ accentColor: "var(--color-accent)" }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  {type.name}
                </div>
                {type.description && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {type.description}
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-primary)", flexShrink: 0 }}>
              {type.price === 0 ? "Gratuit" : `${type.price.toLocaleString("fr-FR")} FCFA`}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}