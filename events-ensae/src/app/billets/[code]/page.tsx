import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEventDate, formatEventTime } from "@/lib/events";
import styles from "./billets.module.css";

type Props = {
    params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props) {
    const { code } = await params;
    const ticket = await prisma.ticket.findUnique({
        where: { qrCode: code },
        include: { event: { select: { title: true } } },
    });
    return {
        title: ticket ? `Billet — ${ticket.event.title}` : "Billet introuvable",
    };
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
    CONFIRMED: { label: "Billet valide", className: "confirmed", icon: "✓" },
    SCANNED: { label: "Billet déjà utilisé", className: "scanned", icon: "✓" },
    PENDING: { label: "En attente de paiement", className: "pending", icon: "○" },
    CANCELLED: { label: "Billet annulé", className: "cancelled", icon: "✕" },
};

const CATEGORY_LABELS: Record<string, string> = {
    SORTIE_PEDAGOGIQUE: "Sortie pédagogique",
    CHAMPIONNAT: "Championnat",
    GALA: "Dîner de Gala",
    CONFERENCE: "Conférence",
    AUTRE: "Événement",
};

export default async function BilletPage({ params }: Props) {
    const { code } = await params;

    const ticket = await prisma.ticket.findUnique({
        where: { qrCode: code },
        include: {
            event: true,
            user: {
                select: { name: true, email: true, filiere: true, promotion: true },
            },
        },
    });

    if (!ticket) notFound();

    const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.CONFIRMED;
    const category = CATEGORY_LABELS[ticket.event.category] ?? "Événement";
    const isValid = ticket.status === "CONFIRMED";

    return (
        <div className={styles.page}>
            {/* ─── En-tête ENSAE ──────────────────────────── */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.logo}>
                        <span className={styles.logoMark}>E</span>
                        <div>
                            <div className={styles.logoName}>ENSAE Événements</div>
                            <div className={styles.logoSub}>Dakar, Sénégal</div>
                        </div>
                    </div>
                    <div className={styles.headerLabel}>Billet numérique</div>
                </div>
            </header>

            <main className={styles.main}>
                {/* ─── Badge statut ────────────────────────── */}
                <div className={`${styles.statusBadge} ${styles[`status_${statusCfg.className}`]}`}>
                    <span className={styles.statusIcon}>{statusCfg.icon}</span>
                    <span className={styles.statusLabel}>{statusCfg.label}</span>
                </div>

                {/* ─── Carte billet ────────────────────────── */}
                <div className={styles.card}>
                    <div className={styles.goldLine} />

                    {/* Catégorie */}
                    <div className={styles.categoryTag}>{category}</div>

                    {/* Titre événement */}
                    <h1 className={styles.eventTitle}>{ticket.event.title}</h1>

                    {/* Infos événement */}
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </span>
                            <div>
                                <div className={styles.infoLabel}>Date</div>
                                <div className={styles.infoValue}>{formatEventDate(ticket.event.date)}</div>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.infoIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                            </span>
                            <div>
                                <div className={styles.infoLabel}>Heure</div>
                                <div className={styles.infoValue}>{formatEventTime(ticket.event.date)}</div>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.infoIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                </svg>
                            </span>
                            <div>
                                <div className={styles.infoLabel}>Lieu</div>
                                <div className={styles.infoValue}>{ticket.event.location}</div>
                            </div>
                        </div>
                    </div>

                    {/* Séparateur perforé */}
                    <div className={styles.perforated} />

                    {/* Titulaire */}
                    <div className={styles.section}>
                        <div className={styles.sectionLabel}>Titulaire</div>
                        <div className={styles.holderName}>{ticket.user.name}</div>
                        <div className={styles.holderMeta}>{ticket.user.email}</div>
                        {(ticket.user.filiere || ticket.user.promotion) && (
                            <div className={styles.holderMeta}>
                                {[ticket.user.filiere, ticket.user.promotion].filter(Boolean).join(" — ")}
                            </div>
                        )}
                    </div>

                    {/* Séparateur perforé */}
                    <div className={styles.perforated} />

                    {/* Code billet */}
                    <div className={styles.section}>
                        <div className={styles.sectionLabel}>Référence billet</div>
                        <div className={styles.ticketCode}>{ticket.qrCode}</div>
                        <div className={styles.issuedAt}>
                            Émis le {new Date(ticket.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric", month: "long", year: "numeric",
                            })}
                        </div>
                    </div>
                </div>

                {/* ─── Avertissement si non valide ─────────── */}
                {!isValid && (
                    <div className={styles.warningBox}>
                        {ticket.status === "SCANNED"
                            ? "Ce billet a déjà été scanné à l'entrée."
                            : ticket.status === "CANCELLED"
                                ? "Ce billet a été annulé et n'est plus valide."
                                : "Ce billet est en attente de confirmation de paiement."}
                    </div>
                )}

                {/* ─── Lien retour ─────────────────────────── */}
                <div className={styles.footer}>
                    <Link href="/profile/tickets" className={styles.footerLink}>
                        Voir tous mes billets
                    </Link>
                    <p className={styles.footerBrand}>ENSAE Événements Dakar</p>
                </div>
            </main>
        </div>
    );
}