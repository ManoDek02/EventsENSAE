import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ENSAE Événements — Dakar",
  description:
    "La plateforme officielle des événements de l'ENSAE Dakar : sorties pédagogiques, championnats inter-classe, dîner de Gala et bien plus.",
  keywords: ["ENSAE", "Dakar", "événements", "étudiants", "Sénégal"],
  openGraph: {
    title: "ENSAE Événements — Dakar",
    description: "La plateforme officielle des événements de l'ENSAE Dakar",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
