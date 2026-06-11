"use client";
// src/components/payment/PaymentInstructions.tsx

import { useState } from "react";
import {
  CheckCircle2, AlertTriangle, Copy, Smartphone, Clock,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import styles from "./PaymentInstructions.module.css";

type Props = {
  ticketId: string;
  ticketCode: string;
  eventTitle: string;
  amount: number;
  userName: string;
  alreadyNotified?: boolean;
};

const WAVE_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_PHONE ?? "776404406";
const OM_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_PHONE ?? "776404406";

export function PaymentInstructions({
  ticketId,
  ticketCode,
  eventTitle,
  amount,
  userName,
  alreadyNotified = false,
}: Props) {
  const [notified, setNotified] = useState(alreadyNotified);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");

  const reference = `${userName.split(" ")[0].toUpperCase()}-${ticketCode.slice(0, 8).toUpperCase()}`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleNotify = async () => {
    if (!paymentProofUrl) {
      setError("Veuillez uploader une capture d'écran de votre paiement avant de confirmer.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tickets/${ticketId}/notify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentProofUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setNotified(true);
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      {/* En-tête */}
      <div className={styles.header}>
        <Smartphone size={20} className={styles.headerIcon} />
        <div>
          <div className={styles.headerTitle}>Instructions de paiement</div>
          <div className={styles.headerSub}>Effectuez le virement pour confirmer votre place</div>
        </div>
      </div>

      {/* Montant */}
      <div className={styles.amount}>
        <span className={styles.amountValue}>{amount.toLocaleString("fr-FR")}</span>
        <span className={styles.amountCurrency}>FCFA</span>
        <span className={styles.amountLabel}>pour {eventTitle}</span>
      </div>

      {/* Étapes */}
      <ol className={styles.steps}>
        <li className={styles.step}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>Choisissez votre moyen de paiement</div>
            <div className={styles.paymentMethods}>
              {/* Wave */}
              <div className={styles.method}>
                <div className={styles.methodBadge} style={{ background: "#1B9CC4", color: "#fff" }}>
                  Wave
                </div>
                <div className={styles.methodNumber}>
                  <span>{WAVE_NUMBER}</span>
                  <button className={styles.copyBtn} onClick={() => copy(WAVE_NUMBER, "wave")} title="Copier">
                    {copied === "wave" ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
              {/* Orange Money */}
              <div className={styles.method}>
                <div className={styles.methodBadge} style={{ background: "#FF6600", color: "#fff" }}>
                  Orange Money
                </div>
                <div className={styles.methodNumber}>
                  <span>{OM_NUMBER}</span>
                  <button className={styles.copyBtn} onClick={() => copy(OM_NUMBER, "om")} title="Copier">
                    {copied === "om" ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </li>

        <li className={styles.step}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>
              Indiquez cette référence dans le message
            </div>
            <div className={styles.reference}>
              <code className={styles.referenceCode}>{reference}</code>
              <button className={styles.copyBtn} onClick={() => copy(reference, "ref")} title="Copier la référence">
                {copied === "ref" ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              </button>
            </div>
            <p className={styles.referenceNote}>
              Cette référence permet à l&apos;admin d&apos;identifier votre paiement rapidement.
            </p>
          </div>
        </li>

        <li className={styles.step}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>
              Prenez une capture d&apos;écran de la confirmation
            </div>
            <p className={styles.stepDesc}>
              Après le virement, prenez une capture d&apos;écran de la confirmation Wave ou Orange Money
              et uploadez-la ci-dessous.
            </p>
          </div>
        </li>

        <li className={styles.step}>
          <div className={styles.stepNumber}>4</div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>
              Uploadez la preuve de paiement <span style={{ color: "var(--color-error)" }}>*</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <ImageUpload
                value={paymentProofUrl}
                onChange={setPaymentProofUrl}
                label=""
              />
            </div>
            {!paymentProofUrl && (
              <p style={{ fontSize: "0.75rem", color: "var(--color-warning)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} />
                Obligatoire avant de confirmer
              </p>
            )}
          </div>
        </li>
      </ol>

      {/* Erreur */}
      {error && (
        <div className={styles.error}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Action */}
      {notified ? (
        <div className={styles.confirmed}>
          <CheckCircle2 size={18} />
          <div>
            <div className={styles.confirmedTitle}>Paiement signalé</div>
            <div className={styles.confirmedSub}>
              L&apos;admin a reçu votre preuve de paiement par email et va confirmer votre billet.
            </div>
          </div>
        </div>
      ) : (
        <button
          className={`btn btn-primary ${styles.notifyBtn}`}
          onClick={handleNotify}
          disabled={loading || !paymentProofUrl}
          style={{ opacity: !paymentProofUrl ? 0.6 : 1 }}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {loading ? "Envoi…" : "J'ai effectué le paiement"}
        </button>
      )}

      {/* Note délai */}
      <div className={styles.delayNote}>
        <Clock size={13} />
        L&apos;admin recevra votre preuve par email et confirmera sous peu.
      </div>
    </div>
  );
}