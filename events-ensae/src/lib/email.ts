import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Vérifiez votre compte — ENSAE Événements",
    html: `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
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
            .btn-wrap { text-align: center; margin: 0 0 32px; }
            .btn { display: inline-block; padding: 14px 40px; background: #1B3A6E; color: #FFFFFF !important; text-decoration: none; border-radius: 8px; font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 0.02em; }
            .divider { height: 1px; background: rgba(27,58,110,0.10); margin: 0 0 24px; }
            .note { font-family: Arial, sans-serif; font-size: 13px; color: #71717A; line-height: 1.6; }
            .note a { color: #1B3A6E; word-break: break-all; }
            .footer { background: #F5F2EC; padding: 22px 40px; border-top: 1px solid rgba(27,58,110,0.10); }
            .footer-name { font-family: Georgia, serif; font-size: 13px; font-weight: 700; color: #1B3A6E; margin-bottom: 3px; }
            .footer-copy { font-family: Arial, sans-serif; font-size: 11px; color: #71717A; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="gold-line"></div>
              <div class="header">
                <div class="badge">ENSAE Dakar — Événements</div>
                <h1>Confirmez votre adresse email</h1>
                <p>Plateforme officielle des événements étudiants</p>
              </div>
              <div class="body">
                <p class="greeting">
                  Bonjour <strong>${name}</strong>,<br /><br />
                  Merci de vous être inscrit sur la plateforme événementielle de l'ENSAE Dakar.
                  Pour activer votre compte et accéder aux événements, cliquez sur le bouton ci-dessous.
                </p>
                <div class="btn-wrap">
                  <a href="${verifyUrl}" class="btn">Vérifier mon compte</a>
                </div>
                <div class="divider"></div>
                <p class="note">
                  Ce lien est valable pendant <strong>24 heures</strong>.<br />
                  Si vous n'avez pas créé de compte, ignorez cet email.<br /><br />
                  Ou copiez ce lien dans votre navigateur :<br />
                  <a href="${verifyUrl}">${verifyUrl}</a>
                </p>
              </div>
              <div class="footer">
                <div class="footer-name">ENSAE Événements</div>
                <div class="footer-copy">© ${new Date().getFullYear()} École Nationale de la Statistique et de l'Analyse Économique — Dakar, Sénégal</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * qrBuffer — Buffer PNG du QR code généré par generateQrBuffer().
 * Envoyé en pièce jointe pour contourner le blocage des data URL
 * par les clients email (Gmail, Outlook, Apple Mail…).
 */
export async function sendTicketEmail(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  qrBuffer: Buffer
) {
  const profileUrl = `${process.env.NEXTAUTH_URL}/profile/tickets`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Votre billet — ${eventTitle}`,
    attachments: [
      {
        filename: "qr-billet.png",
        content: qrBuffer,
        contentType: "image/png",
      },
    ],
    html: `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Georgia, serif; background: #F5F2EC; color: #18181B; }
            .wrapper { padding: 40px 20px; }
            .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid rgba(27,58,110,0.13); box-shadow: 0 16px 48px rgba(15,35,71,0.12); }
            .gold-line { height: 3px; background: linear-gradient(90deg, #B8861A 0%, #D4A030 100%); }
            .header { background: #1B3A6E; padding: 36px 40px 32px; text-align: center; }
            .badge { display: inline-block; background: rgba(184,134,26,0.22); color: #D4A030; font-family: Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px; margin-bottom: 16px; }
            .header h1 { color: #FFFFFF; font-size: 21px; font-weight: 700; margin-bottom: 6px; }
            .header p { color: rgba(255,255,255,0.65); font-family: Arial, sans-serif; font-size: 13px; }
            .body { padding: 36px 40px; }
            .greeting { font-family: Arial, sans-serif; font-size: 15px; color: #3F3F46; line-height: 1.7; margin-bottom: 24px; }
            .greeting strong { color: #1B3A6E; }
            .event-card { background: #F5F2EC; border: 1px solid rgba(27,58,110,0.13); border-left: 3px solid #B8861A; border-radius: 8px; padding: 18px 22px; margin-bottom: 28px; }
            .event-label { font-family: Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #B8861A; margin-bottom: 6px; }
            .event-title { font-size: 17px; font-weight: 700; color: #1B3A6E; margin-bottom: 5px; }
            .event-date { font-family: Arial, sans-serif; font-size: 13px; color: #3F3F46; }
            .qr-notice { background: #F5F2EC; border: 1px dashed rgba(27,58,110,0.25); border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px; }
            .qr-notice-title { font-family: Arial, sans-serif; font-size: 13px; font-weight: 700; color: #1B3A6E; margin-bottom: 6px; letter-spacing: 0.02em; }
            .qr-notice-sub { font-family: Arial, sans-serif; font-size: 12px; color: #71717A; line-height: 1.55; }
            .qr-filename { display: inline-block; margin-top: 10px; padding: 4px 12px; background: #FFFFFF; border: 1px solid rgba(27,58,110,0.18); border-radius: 4px; font-family: monospace; font-size: 12px; color: #1B3A6E; }
            .btn-wrap { text-align: center; margin-bottom: 28px; }
            .btn { display: inline-block; padding: 12px 32px; background: #1B3A6E; color: #FFFFFF !important; text-decoration: none; border-radius: 8px; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; }
            .divider { height: 1px; background: rgba(27,58,110,0.10); margin-bottom: 20px; }
            .warning { font-family: Arial, sans-serif; font-size: 12px; color: #71717A; font-style: italic; text-align: center; }
            .footer { background: #F5F2EC; padding: 22px 40px; border-top: 1px solid rgba(27,58,110,0.10); }
            .footer-name { font-family: Georgia, serif; font-size: 13px; font-weight: 700; color: #1B3A6E; margin-bottom: 3px; }
            .footer-copy { font-family: Arial, sans-serif; font-size: 11px; color: #71717A; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="gold-line"></div>
              <div class="header">
                <div class="badge">Billet numérique</div>
                <h1>Votre place est confirmée</h1>
                <p>ENSAE Dakar — Plateforme Événementielle</p>
              </div>
              <div class="body">
                <p class="greeting">
                  Félicitations <strong>${name}</strong>, votre réservation a été enregistrée.
                  Votre QR code est joint en pièce jointe — présentez-le à l'entrée de l'événement.
                </p>

                <div class="event-card">
                  <div class="event-label">Événement</div>
                  <div class="event-title">${eventTitle}</div>
                  <div class="event-date">${eventDate}</div>
                </div>

                <div class="qr-notice">
                  <div class="qr-notice-title">QR Code d'entrée joint en pièce jointe</div>
                  <div class="qr-notice-sub">
                    Ouvrez la pièce jointe pour afficher votre QR code.<br />
                    Il contient toutes vos informations de réservation.
                  </div>
                  <div class="qr-filename">qr-billet.png</div>
                </div>

                <div class="btn-wrap">
                  <a href="${profileUrl}" class="btn">Voir mon billet en ligne</a>
                </div>

                <div class="divider"></div>
                <p class="warning">Billet personnel et nominatif. Tout partage invalide la réservation.</p>
              </div>
              <div class="footer">
                <div class="footer-name">ENSAE Événements</div>
                <div class="footer-copy">© ${new Date().getFullYear()} École Nationale de la Statistique et de l'Analyse Économique — Dakar, Sénégal</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}