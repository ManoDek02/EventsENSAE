// src/lib/email.ts
// Tous les emails transactionnels de la plateforme ENSAE Events.
// Utilise Nodemailer/SMTP via src/lib/mailer.ts

import { sendMail } from "@/lib/mailer";

/* ─── Styles communs ─────────────────────────────────────────── */
const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; background: #F5F2EC; color: #18181B; }
  .wrapper { padding: 40px 20px; }
  .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid rgba(27,58,110,0.13); box-shadow: 0 16px 48px rgba(15,35,71,0.12); }
  .gold-line { height: 3px; background: linear-gradient(90deg, #B8861A 0%, #D4A030 100%); }
  .header { background: #1B3A6E; padding: 36px 40px 32px; }
  .badge { display: inline-block; background: rgba(184,134,26,0.22); color: #D4A030; font-family: Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px; margin-bottom: 18px; }
  .header h1 { color: #FFFFFF; font-size: 21px; font-weight: 700; line-height: 1.3; margin-bottom: 6px; }
  .header p { color: rgba(255,255,255,0.65); font-family: Arial, sans-serif; font-size: 13px; }
  .body { padding: 36px 40px; }
  .greeting { font-family: Arial, sans-serif; font-size: 15px; color: #3F3F46; line-height: 1.7; margin-bottom: 28px; }
  .greeting strong { color: #1B3A6E; }
  .event-card { background: #F5F2EC; border: 1px solid rgba(27,58,110,0.13); border-left: 3px solid #B8861A; border-radius: 8px; padding: 18px 22px; margin-bottom: 28px; }
  .event-label { font-family: Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #B8861A; margin-bottom: 6px; }
  .event-title { font-size: 17px; font-weight: 700; color: #1B3A6E; margin-bottom: 5px; }
  .event-date { font-family: Arial, sans-serif; font-size: 13px; color: #3F3F46; }
  .btn-wrap { text-align: center; margin-bottom: 28px; }
  .btn { display: inline-block; padding: 12px 32px; background: #1B3A6E; color: #FFFFFF !important; text-decoration: none; border-radius: 8px; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; }
  .divider { height: 1px; background: rgba(27,58,110,0.10); margin-bottom: 20px; }
  .warning { font-family: Arial, sans-serif; font-size: 12px; color: #71717A; font-style: italic; text-align: center; }
  .footer { background: #F5F2EC; padding: 22px 40px; border-top: 1px solid rgba(27,58,110,0.10); }
  .footer-name { font-family: Georgia, serif; font-size: 13px; font-weight: 700; color: #1B3A6E; margin-bottom: 3px; }
  .footer-copy { font-family: Arial, sans-serif; font-size: 11px; color: #71717A; }
`;

function layout(headerBadge: string, headerTitle: string, headerSub: string, body: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="gold-line"></div>
      <div class="header">
        <div class="badge">${headerBadge}</div>
        <h1>${headerTitle}</h1>
        <p>${headerSub}</p>
      </div>
      <div class="body">${body}</div>
      <div class="footer">
        <div class="footer-name">ENSAE Événements</div>
        <div class="footer-copy">© ${new Date().getFullYear()} École Nationale de la Statistique et de l'Analyse Économique — Dakar, Sénégal</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════════
   1. VÉRIFICATION COMPTE
══════════════════════════════════════════════════════════════ */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;

  const body = `
    <p class="greeting">Bonjour <strong>${name}</strong>,<br/>
    Merci de vous être inscrit sur la plateforme événementielle de l'ENSAE Dakar.
    Cliquez sur le bouton ci-dessous pour activer votre compte.</p>
    <div class="btn-wrap">
      <a href="${verifyUrl}" class="btn">Vérifier mon adresse email</a>
    </div>
    <div class="divider"></div>
    <p class="warning">Ce lien est valide 24h. Si vous n'avez pas créé de compte, ignorez cet email.</p>
  `;

  await sendMail({
    to: email,
    subject: "Vérifiez votre compte — ENSAE Événements",
    html: layout("Activation du compte", "Bienvenue sur ENSAE Events", "ENSAE Dakar — Plateforme Événementielle", body),
  });
}

/* ══════════════════════════════════════════════════════════════
   2. CONFIRMATION BILLET (avec QR en pièce jointe)
══════════════════════════════════════════════════════════════ */
export async function sendTicketEmail(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  qrBuffer: Buffer
) {
  const profileUrl = `${process.env.NEXTAUTH_URL}/profile/tickets`;

  const body = `
    <p class="greeting">Félicitations <strong>${name}</strong>,<br/>
    Votre réservation a été confirmée. Votre QR code est joint en pièce jointe — présentez-le à l'entrée.</p>
    <div class="event-card">
      <div class="event-label">Événement</div>
      <div class="event-title">${eventTitle}</div>
      <div class="event-date">${eventDate}</div>
    </div>
    <div class="btn-wrap">
      <a href="${profileUrl}" class="btn">Voir mon billet en ligne</a>
    </div>
    <div class="divider"></div>
    <p class="warning">Billet personnel et nominatif. Tout partage invalide la réservation.</p>
  `;

  await sendMail({
    to: email,
    subject: `Votre billet — ${eventTitle}`,
    html: layout("Billet numérique", "Votre place est confirmée", "ENSAE Dakar — Plateforme Événementielle", body),
    attachments: [
      { filename: "qr-billet.png", content: qrBuffer, contentType: "image/png" },
    ],
  });
}

/* ══════════════════════════════════════════════════════════════
   3. RAPPEL ÉVÉNEMENT (J-3, J-1, quelques heures avant)
══════════════════════════════════════════════════════════════ */
export async function sendEventReminderEmail(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  eventUrl: string,
  delay: "J-3" | "J-1" | "H-3"
) {
  const DELAY_LABELS = {
    "J-3": { badge: "Rappel J-3", title: "Dans 3 jours !", sub: "Votre événement approche" },
    "J-1": { badge: "Rappel J-1", title: "Demain c'est le jour !", sub: "Préparez-vous" },
    "H-3": { badge: "Aujourd'hui !", title: "C'est dans quelques heures", sub: "Votre événement commence bientôt" },
  };

  const labels = DELAY_LABELS[delay];

  const body = `
    <p class="greeting">Bonjour <strong>${name}</strong>,<br/>
    Petit rappel : l'événement <strong>${eventTitle}</strong> auquel vous êtes inscrit approche !</p>
    <div class="event-card">
      <div class="event-label">Événement</div>
      <div class="event-title">${eventTitle}</div>
      <div class="event-date">${eventDate}</div>
      <div class="event-date" style="margin-top:4px;">📍 ${eventLocation}</div>
    </div>
    <div class="btn-wrap">
      <a href="${eventUrl}" class="btn">Voir mon billet</a>
    </div>
    <div class="divider"></div>
    <p class="warning">N'oubliez pas votre QR code disponible dans votre profil.</p>
  `;

  await sendMail({
    to: email,
    subject: `[${delay}] ${eventTitle} — Ne l'oubliez pas !`,
    html: layout(labels.badge, labels.title, labels.sub, body),
  });
}

/* ══════════════════════════════════════════════════════════════
   4. PLACE LIBÉRÉE (liste d'attente)
══════════════════════════════════════════════════════════════ */
export async function sendWaitlistAvailableEmail(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventUrl: string
) {
  const body = `
    <p class="greeting">Bonne nouvelle <strong>${name}</strong> !<br/>
    Une place s'est libérée pour l'événement <strong>${eventTitle}</strong>.
    Dépêchez-vous — les places sont limitées et attribuées par ordre d'arrivée.</p>
    <div class="event-card">
      <div class="event-label">Place disponible</div>
      <div class="event-title">${eventTitle}</div>
      <div class="event-date">${eventDate}</div>
    </div>
    <div class="btn-wrap">
      <a href="${eventUrl}" class="btn">Réserver ma place maintenant</a>
    </div>
    <div class="divider"></div>
    <p class="warning">Cette opportunité est limitée dans le temps. Réservez rapidement.</p>
  `;

  await sendMail({
    to: email,
    subject: `Une place s'est libérée — ${eventTitle}`,
    html: layout("Liste d'attente", "Une place est disponible !", "ENSAE Dakar — Plateforme Événementielle", body),
  });
}

/* ══════════════════════════════════════════════════════════════
   5. ANNONCE PLAYLIST FINALE
══════════════════════════════════════════════════════════════ */
export async function sendPlaylistAnnouncementEmail(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  tracks: Array<{ title: string; artist: string; votes: number }>,
  eventUrl: string
) {
  const top3 = tracks.slice(0, 3);

  const trackRows = top3
    .map(
      (t, i) => `
      <tr>
        <td style="padding:10px 14px; font-family:Arial,sans-serif; font-size:13px; color:#B8861A; font-weight:700; width:32px;">${i + 1}</td>
        <td style="padding:10px 14px; font-family:Arial,sans-serif; font-size:13px; color:#18181B; font-weight:600;">${t.title}<br/><span style="font-weight:400; color:#71717A;">${t.artist}</span></td>
        <td style="padding:10px 14px; font-family:Arial,sans-serif; font-size:12px; color:#71717A; text-align:right;">${t.votes} vote${t.votes > 1 ? "s" : ""}</td>
      </tr>`
    )
    .join("");

  const body = `
    <p class="greeting">Bonjour <strong>${name}</strong>,<br/>
    La playlist officielle de <strong>${eventTitle}</strong> vient d'être annoncée par les organisateurs.
    Voici le top sélectionné par la communauté :</p>
    <table style="width:100%; border-collapse:collapse; margin-bottom:28px; border:1px solid rgba(27,58,110,0.13); border-radius:8px; overflow:hidden;">
      <thead>
        <tr style="background:#F5F2EC;">
          <th style="padding:10px 14px; text-align:left; font-family:Arial,sans-serif; font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#71717A;">#</th>
          <th style="padding:10px 14px; text-align:left; font-family:Arial,sans-serif; font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#71717A;">Titre / Artiste</th>
          <th style="padding:10px 14px; text-align:right; font-family:Arial,sans-serif; font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#71717A;">Votes</th>
        </tr>
      </thead>
      <tbody>${trackRows}</tbody>
    </table>
    <div class="btn-wrap">
      <a href="${eventUrl}" class="btn">Voir la playlist complète</a>
    </div>
    <div class="divider"></div>
    <p class="warning">Merci à tous les participants pour vos suggestions et votes !</p>
  `;

  await sendMail({
    to: email,
    subject: `Playlist officielle annoncée — ${eventTitle}`,
    html: layout("Playlist officielle", "La playlist est prête !", `${eventTitle} — ${eventDate}`, body),
  });
}