// src/app/profile/tickets/page.tsx
import Link from "next/link";
import { Calendar, MapPin, Ticket, Tag } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/events";
import { buildTicketQrContent, generateQrDataUrl } from "@/lib/qr";
import styles from "../../app-page.module.css";

export const metadata = { title: "Mes Billets | ENSAE Events" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de paiement",
  PENDING_REVIEW: "Paiement en vérification",
  CONFIRMED: "Confirmé",
  SCANNED: "Utilisé",
  CANCELLED: "Annulé",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: styles.statusPending,
  PENDING_REVIEW: styles.statusPending,
  CONFIRMED: styles.statusConfirmed,
  SCANNED: styles.statusScanned,
  CANCELLED: styles.statusCancelled,
};

export default async function ProfileTicketsPage() {
  const session = await requireAuth();

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    include: {
      event: true,
      ticketType: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const ticketsWithQr = await Promise.all(
    tickets.map(async (ticket) => {
      const showQr = ticket.status === "CONFIRMED" || ticket.status === "SCANNED";
      let qrDataUrl: string | null = null;
      if (showQr) {
        const qrContent = buildTicketQrContent(ticket.qrCode);
        qrDataUrl = await generateQrDataUrl(qrContent);
      }
      return { ticket, qrDataUrl };
    })
  );

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className="container">
          <div className={styles.eyebrow}><Ticket size={15} /> Billetterie</div>
          <h1 className={styles.title}>Mes Billets</h1>
          <p className={styles.subtitle}>
            Retrouvez ici vos billets numériques. Scannez le QR code à l&apos;entrée de l&apos;événement.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          {ticketsWithQr.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><Ticket size={28} /></div>
              <h2 className={styles.emptyTitle}>Aucun billet pour le moment</h2>
              <p className={styles.emptyText}>
                Réservez votre place sur un événement pour recevoir votre billet numérique avec QR code.
              </p>
              <Link href="/events" className="btn btn-primary">
                <Calendar size={16} /> Découvrir les événements
              </Link>
            </div>
          ) : (
            <div className={styles.ticketGrid}>
              {ticketsWithQr.map(({ ticket, qrDataUrl }) => (
                <article key={ticket.id} className={styles.ticketCard}>
                  <div className={styles.ticketHeader}>
                    <div>
                      <h2 className={styles.ticketTitle}>{ticket.event.title}</h2>
                      <p className={styles.ticketDate}>{formatEventDate(ticket.event.date)}</p>
                    </div>
                    <span className={STATUS_CLASS[ticket.status] ?? styles.statusPending}>
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </span>
                  </div>

                  <p className={styles.ticketLocation}>
                    <MapPin size={15} /> {ticket.event.location}
                  </p>

                  {/* ── Type de billet ── */}
                  {ticket.ticketType && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 12px",
                      background: "rgba(79, 70, 229, 0.07)",
                      border: "1px solid rgba(79, 70, 229, 0.18)",
                      borderRadius: 999,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#4338ca",
                      marginTop: 4,
                    }}>
                      <Tag size={12} />
                      {ticket.ticketType.name}
                      {ticket.ticketType.price > 0 && (
                        <span style={{ fontWeight: 500, opacity: 0.75 }}>
                          — {ticket.ticketType.price.toLocaleString("fr-FR")} FCFA
                        </span>
                      )}
                    </div>
                  )}

                  {qrDataUrl ? (
                    <div className={styles.qrWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrDataUrl} alt="QR Code billet" className={styles.qrImage} />
                      <p className={styles.qrHint}>
                        Scannez ce code à l&apos;entrée — s&apos;ouvre sur une page de vérification.
                      </p>
                      <code className={styles.qrCode}>{ticket.qrCode.slice(0, 8)}…</code>
                    </div>
                  ) : ticket.status === "PENDING" || ticket.status === "PENDING_REVIEW" ? (
                    <p className={styles.ticketPendingNote}>
                      {ticket.status === "PENDING_REVIEW"
                        ? "Votre paiement est en cours de vérification par l'admin."
                        : "Votre billet sera disponible après confirmation du paiement."}
                    </p>
                  ) : null}

                  <Link href={`/events/${ticket.eventId}`} className="btn btn-ghost btn-sm">
                    Voir l&apos;événement
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}