import Link from "next/link";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatEventDate } from "@/lib/events";
import { generateQrDataUrl } from "@/lib/qr";
import styles from "../../app-page.module.css";

export const metadata = {
  title: "Mes Billets | ENSAE Events",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de paiement",
  CONFIRMED: "Confirmé",
  SCANNED: "Utilisé",
  CANCELLED: "Annulé",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: styles.statusPending,
  CONFIRMED: styles.statusConfirmed,
  SCANNED: styles.statusScanned,
  CANCELLED: styles.statusCancelled,
};

export default async function ProfileTicketsPage() {
  const session = await requireAuth();

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  const ticketsWithQr = await Promise.all(
    tickets.map(async (ticket) => {
      const showQr = ticket.status === "CONFIRMED" || ticket.status === "SCANNED";
      const qrDataUrl = showQr ? await generateQrDataUrl(ticket.qrCode) : null;
      return { ticket, qrDataUrl };
    })
  );

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className="container">
          <div className={styles.eyebrow}>
            <Ticket size={15} />
            Billetterie
          </div>
          <h1 className={styles.title}>Mes Billets</h1>
          <p className={styles.subtitle}>
            Retrouvez ici vos billets numériques et leurs QR codes pour l&apos;entrée aux événements.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          {ticketsWithQr.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <Ticket size={28} />
              </div>
              <h2 className={styles.emptyTitle}>Aucun billet pour le moment</h2>
              <p className={styles.emptyText}>
                Réservez votre place sur un événement pour recevoir votre billet numérique avec QR code.
              </p>
              <Link href="/events" className="btn btn-primary">
                <Calendar size={16} />
                Découvrir les événements
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
                    <MapPin size={15} />
                    {ticket.event.location}
                  </p>

                  {qrDataUrl ? (
                    <div className={styles.qrWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrDataUrl} alt="QR Code billet" className={styles.qrImage} />
                      <p className={styles.qrHint}>
                        Présentez ce QR code à l&apos;entrée. Ne le partagez pas.
                      </p>
                      <code className={styles.qrCode}>{ticket.qrCode.slice(0, 8)}…</code>
                    </div>
                  ) : ticket.status === "PENDING" ? (
                    <p className={styles.ticketPendingNote}>
                      Votre billet sera disponible avec QR code après confirmation du paiement.
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
