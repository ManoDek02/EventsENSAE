import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@ensae-dakar.sn";

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Vérifiez votre compte — ENSAE Événements",
    html: `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: #0a0a0f; color: #fff; margin: 0; padding: 0; }
            .container { max-width: 560px; margin: 40px auto; background: #13131a; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a3d; }
            .header { background: linear-gradient(135deg, #6c3de8, #3d8ef8); padding: 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
            .body { padding: 40px; }
            .body p { color: #c0c0d0; line-height: 1.7; }
            .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: linear-gradient(135deg, #6c3de8, #3d8ef8); color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
            .footer { border-top: 1px solid #2a2a3d; padding: 24px 40px; text-align: center; font-size: 12px; color: #555; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 ENSAE Événements</h1>
              <p>Plateforme officielle des événements ENSAE Dakar</p>
            </div>
            <div class="body">
              <p>Salut <strong>${name}</strong> 👋</p>
              <p>Merci de t'être inscrit(e) sur la plateforme événementielle de l'ENSAE. Pour activer ton compte et commencer à découvrir les événements, clique sur le bouton ci-dessous :</p>
              <a href="${verifyUrl}" class="btn">✅ Vérifier mon compte</a>
              <p>Ce lien est valable pendant <strong>24 heures</strong>. Si tu n'as pas créé de compte, tu peux ignorer cet email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ENSAE Dakar — Plateforme Événementielle</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendTicketEmail(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  qrCodeDataUrl: string
) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Votre billet — ${eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: #0a0a0f; color: #fff; margin: 0; padding: 0; }
            .container { max-width: 560px; margin: 40px auto; background: #13131a; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a3d; }
            .header { background: linear-gradient(135deg, #6c3de8, #3d8ef8); padding: 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .body { padding: 40px; text-align: center; }
            .body p { color: #c0c0d0; line-height: 1.7; }
            .qr { margin: 24px auto; background: #fff; padding: 16px; border-radius: 12px; display: inline-block; }
            .event-info { background: #1a1a2e; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left; }
            .event-info p { margin: 6px 0; color: #c0c0d0; }
            .footer { border-top: 1px solid #2a2a3d; padding: 24px 40px; text-align: center; font-size: 12px; color: #555; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 Votre Billet</h1>
            </div>
            <div class="body">
              <p>Félicitations <strong>${name}</strong> ! Votre billet est confirmé.</p>
              <div class="event-info">
                <p>🎉 <strong>Événement :</strong> ${eventTitle}</p>
                <p>📅 <strong>Date :</strong> ${eventDate}</p>
              </div>
              <p>Présentez ce QR Code à l'entrée :</p>
              <div class="qr">
                <img src="${qrCodeDataUrl}" alt="QR Code Billet" width="200" height="200" />
              </div>
              <p><small>Ne partagez pas ce QR Code, il est personnel et unique.</small></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ENSAE Dakar — Plateforme Événementielle</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
