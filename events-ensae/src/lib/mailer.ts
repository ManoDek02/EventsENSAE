// src/lib/mailer.ts
// Transport SMTP Nodemailer — remplace Resend pour tous les envois email.
// Compatible Gmail, Outlook, et tout serveur SMTP standard.

import nodemailer from "nodemailer";

/* ─── Transport singleton ────────────────────────────────────── */
let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (_transporter) return _transporter;

    const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        throw new Error(
            "SMTP_USER et SMTP_PASS sont requis dans le .env pour l'envoi d'emails."
        );
    }

    _transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // TLS direct sur 465, STARTTLS sur 587
        auth: { user, pass },
        tls: {
            // Tolérer les certificats auto-signés en dev
            rejectUnauthorized: process.env.NODE_ENV === "production",
        },
    });

    return _transporter;
}

/* ─── Fonction d'envoi centrale ─────────────────────────────── */
export async function sendMail(options: {
    to: string | string[];
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
    }>;
}) {
    const transporter = getTransporter();
    const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER;

    await transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments?.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
        })),
    });
}