// src/lib/email-escort.ts
// Version mise à jour — numéro de téléphone inclus dans les emails de match

import { sendMail } from "@/lib/mailer";

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; background: #1a0a0a; color: #2d1515; }
  .wrapper { padding: 40px 20px; background: #1a0a0a; }
  .container { max-width: 560px; margin: 0 auto; background: #fff8f0; border-radius: 16px; overflow: hidden; border: 1px solid #f0c4a0; box-shadow: 0 20px 60px rgba(180, 60, 60, 0.25); }
  .rose-line { height: 4px; background: linear-gradient(90deg, #c9184a 0%, #e05c8a 50%, #ffb3c6 100%); }
  .header { background: linear-gradient(135deg, #590d22 0%, #800f2f 50%, #a4133c 100%); padding: 40px 40px 36px; text-align: center; position: relative; overflow: hidden; }
  .header::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(255,183,197,0.15) 0%, transparent 70%); border-radius: 50%; }
  .heart { font-size: 32px; margin-bottom: 12px; display: block; }
  .header h1 { color: #ffb3c6; font-size: 22px; font-weight: 400; font-style: italic; line-height: 1.4; margin-bottom: 6px; }
  .header-sub { color: rgba(255,179,198,0.65); font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
  .body { padding: 36px 40px; }
  .greeting { font-size: 16px; color: #590d22; line-height: 1.8; margin-bottom: 24px; }
  .greeting strong { color: #800f2f; }
  .profile-card { background: #ffffff; border: 1px solid #ffb3c6; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; display: flex; gap: 16px; align-items: flex-start; }
  .profile-photo { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #ffb3c6; flex-shrink: 0; background: linear-gradient(135deg, #ffb3c6, #ff758f); display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .profile-info { flex: 1; }
  .profile-name { font-size: 17px; font-weight: 700; color: #590d22; margin-bottom: 3px; }
  .profile-meta { font-family: Arial, sans-serif; font-size: 12px; color: #a4133c; font-weight: 600; letter-spacing: 0.03em; margin-bottom: 8px; }
  .btn-wrap { text-align: center; margin: 28px 0; }
  .btn-single { display: inline-block; padding: 13px 32px; background: linear-gradient(135deg, #c9184a, #e05c8a); color: #ffffff !important; text-decoration: none; border-radius: 50px; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; }
  .divider { height: 1px; background: linear-gradient(90deg, transparent, #ffb3c6, transparent); margin: 24px 0; }
  .note { font-family: Arial, sans-serif; font-size: 12px; color: #a4133c; text-align: center; font-style: italic; line-height: 1.6; }
  .contact-box { background: #fff0f5; border: 1px solid #ffb3c6; border-radius: 10px; padding: 18px 22px; margin-bottom: 24px; }
  .contact-label { font-family: Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c9184a; margin-bottom: 10px; }
  .contact-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(255,179,198,0.3); }
  .contact-row:last-child { border-bottom: none; }
  .contact-icon { font-size: 14px; width: 20px; flex-shrink: 0; }
  .contact-value { font-size: 14px; font-weight: 600; color: #590d22; }
  .footer { background: #590d22; padding: 20px 40px; text-align: center; }
  .footer-text { font-family: Arial, sans-serif; font-size: 11px; color: rgba(255,179,198,0.7); }
`;

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>${BASE_STYLES}</style></head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="rose-line"></div>
    <div class="header">
      <span class="heart">🌹</span>
      <h1>${title}</h1>
      <div class="header-sub">Gala ENSAE Dakar · Système Cavalier / Cavalière</div>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      <div class="footer-text">ENSAE Événements — Dakar, Sénégal · Cette mise en relation est confidentielle</div>
    </div>
  </div>
</div>
</body></html>`;
}

/* ── 1. Nouvelle candidature reçue ─────────────────────────── */
export async function sendNewProposalEmail({
  to, requesterName, proposerName, proposerFiliere,
  proposerPromotion, proposerMessage, proposerPhoto,
  acceptUrl, rejectUrl, eventTitle,
}: {
  to: string;
  requesterName: string;
  proposerName: string;
  proposerFiliere?: string | null;
  proposerPromotion?: string | null;
  proposerMessage: string;
  proposerPhoto?: string | null;
  acceptUrl: string;
  rejectUrl: string;
  eventTitle: string;
}) {
  const photoHtml = proposerPhoto
    ? `<img src="${proposerPhoto}" class="profile-photo" alt="${proposerName}" />`
    : `<div class="profile-photo">💫</div>`;

  const meta = [proposerFiliere, proposerPromotion].filter(Boolean).join(" · ");

  const body = `
    <p class="greeting">
      Chère <strong>${requesterName}</strong>,<br/><br/>
      Quelqu'un a remarqué votre demande pour le <strong>${eventTitle}</strong> et souhaite être votre cavalier / cavalière pour cette soirée exceptionnelle…
    </p>
    <div class="profile-card">
      ${photoHtml}
      <div class="profile-info">
        <div class="profile-name">${proposerName}</div>
        ${meta ? `<div class="profile-meta">${meta}</div>` : ""}
        <div style="font-size:14px; color:#6b2737; line-height:1.6; font-style:italic;">
          <span style="color:#ffb3c6; font-size:1.2em;">"</span>${proposerMessage}<span style="color:#ffb3c6; font-size:1.2em;">"</span>
        </div>
      </div>
    </div>
    <p style="font-family:Arial,sans-serif; font-size:13px; color:#6b2737; text-align:center; margin-bottom:20px; line-height:1.7;">
      Cette rencontre était peut-être écrite dans les étoiles…<br/>
      Vous avez 48h pour répondre.
    </p>
    <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-bottom:28px;">
      <a href="${acceptUrl}" style="display:inline-block; padding:12px 28px; background:linear-gradient(135deg,#c9184a,#e05c8a); color:#fff; text-decoration:none; border-radius:50px; font-family:Arial,sans-serif; font-size:14px; font-weight:700;">✨ Accepter</a>
      <a href="${rejectUrl}" style="display:inline-block; padding:12px 28px; background:transparent; color:#a4133c; text-decoration:none; border-radius:50px; font-family:Arial,sans-serif; font-size:14px; font-weight:600; border:1.5px solid #ffb3c6;">Décliner</a>
    </div>
    <div class="divider"></div>
    <p class="note">Si vous acceptez, vos coordonnées (email et téléphone) seront partagées mutuellement.<br/>Votre demande sera retirée de la liste publique.</p>
  `;

  await sendMail({
    to,
    subject: `💌 Quelqu'un a remarqué votre demande — ${eventTitle}`,
    html: layout("Une nouvelle proposition pour vous", body),
  });
}

/* ── 2. Match confirmé — envoyé aux DEUX ────────────────────── */
export async function sendMatchConfirmedEmail({
  to, recipientName, partnerName, partnerFiliere,
  partnerPromotion, partnerEmail, partnerPhone,
  partnerPhoto, eventTitle,
}: {
  to: string;
  recipientName: string;
  partnerName: string;
  partnerFiliere?: string | null;
  partnerPromotion?: string | null;
  partnerEmail: string;
  partnerPhone?: string | null;   // ← NOUVEAU
  partnerPhoto?: string | null;
  eventTitle: string;
}) {
  const photoHtml = partnerPhoto
    ? `<img src="${partnerPhoto}" class="profile-photo" alt="${partnerName}" />`
    : `<div class="profile-photo">💑</div>`;

  const meta = [partnerFiliere, partnerPromotion].filter(Boolean).join(" · ");

  const body = `
    <p class="greeting">
      Félicitations <strong>${recipientName}</strong> ! 🎉<br/><br/>
      C'est un match ! Vous avez trouvé votre cavalier / cavalière pour le <strong>${eventTitle}</strong>.
      Voici les coordonnées de votre partenaire pour cette soirée inoubliable.
    </p>
    <div class="profile-card">
      ${photoHtml}
      <div class="profile-info">
        <div class="profile-name">${partnerName}</div>
        ${meta ? `<div class="profile-meta">${meta}</div>` : ""}
      </div>
    </div>

    <div class="contact-box">
      <div class="contact-label">Coordonnées de votre cavalier / cavalière</div>
      <div class="contact-row">
        <span class="contact-icon">✉️</span>
        <span class="contact-value">${partnerEmail}</span>
      </div>
      ${partnerPhone ? `
      <div class="contact-row">
        <span class="contact-icon">📱</span>
        <span class="contact-value">${partnerPhone}</span>
      </div>
      ` : ""}
    </div>

    <p style="font-family:Arial,sans-serif; font-size:13px; color:#6b2737; text-align:center; margin-bottom:24px; line-height:1.7;">
      Prenez contact et préparez ensemble cette soirée exceptionnelle.<br/>
      Nous vous souhaitons une soirée mémorable au Gala ENSAE.
    </p>
    <div class="btn-wrap">
      <a href="${process.env.NEXTAUTH_URL ?? ''}/profile/tickets" class="btn-single">Voir mon billet</a>
    </div>
    <div class="divider"></div>
    <p class="note">Cette mise en relation est confidentielle.<br/>Profitez de chaque instant ✨</p>
  `;

  await sendMail({
    to,
    subject: `💑 C'est un match ! Votre cavalier(ère) pour ${eventTitle}`,
    html: layout("C'est un match !", body),
  });
}

/* ── 3. Candidature refusée ─────────────────────────────────── */
export async function sendProposalRejectedEmail({
  to, proposerName, eventTitle,
}: {
  to: string;
  proposerName: string;
  eventTitle: string;
}) {
  const body = `
    <p class="greeting">
      Cher(e) <strong>${proposerName}</strong>,<br/><br/>
      Malheureusement, votre proposition pour le <strong>${eventTitle}</strong> n'a pas été retenue cette fois-ci.
      Ne vous découragez pas — d'autres belles rencontres vous attendent peut-être !
    </p>
    <p style="font-family:Arial,sans-serif; font-size:13px; color:#6b2737; text-align:center; margin-bottom:24px; line-height:1.7;">
      Vous pouvez toujours postuler à d'autres demandes et tenter votre chance.<br/>
      Le Gala ENSAE réserve bien des surprises… 🌹
    </p>
    <div class="btn-wrap">
      <a href="${process.env.NEXTAUTH_URL ?? ''}/events" class="btn-single">Voir les autres demandes</a>
    </div>
  `;

  await sendMail({
    to,
    subject: `Réponse à votre proposition — ${eventTitle}`,
    html: layout("Une réponse à votre proposition", body),
  });
}