import QRCode from "qrcode";

const QR_OPTIONS = {
  width: 280,
  margin: 2,
  color: { dark: "#1B3A6E", light: "#FFFFFF" },
} as const;

/**
 * Retourne l'URL encodée dans le QR code.
 * Quand on scanne → ouvre /billets/[code] → page lisible sur mobile.
 */
export function buildTicketQrContent(qrCode: string): string {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${baseUrl}/billets/${qrCode}`;
}

/** Pour l'affichage web — page /profile/tickets */
export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, QR_OPTIONS);
}

/** Pour les pièces jointes email — retourne un Buffer PNG */
export async function generateQrBuffer(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { ...QR_OPTIONS, type: "png" });
}