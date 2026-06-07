import QRCode from "qrcode";

export async function generateQrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    width: 280,
    margin: 2,
    color: { dark: "#1B3A6E", light: "#FFFFFF" },
  });
}
