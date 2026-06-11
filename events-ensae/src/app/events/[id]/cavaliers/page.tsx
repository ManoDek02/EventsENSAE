"use client";
// src/app/events/[id]/cavaliers/page.tsx
// v3 — ajout du numéro de téléphone dans les formulaires

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Heart, X, Send, Loader2, Trash2, Users, Inbox, CheckCircle2, XCircle, Phone } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import styles from "./cavaliers.module.css";

type Request = {
  id: string;
  title: string;
  message: string;
  photoUrl: string | null;
  genderPreference: "HOMME" | "FEMME" | "INDIFFERENT";
  createdAt: string;
  requester: {
    id: string;
    name: string;
    filiere: string | null;
    promotion: string | null;
    image: string | null;
  };
  _count: { proposals: number };
};

type Proposal = {
  id: string;
  message: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  proposer: {
    id: string;
    name: string;
    email: string;
    filiere: string | null;
    promotion: string | null;
    image: string | null;
  };
};

type CurrentUser = {
  id: string;
  name: string;
  myRequest: Request | null;
  hasMatch: boolean;
};

const GENDER_LABELS = {
  HOMME: "Cherche un cavalier",
  FEMME: "Cherche une cavalière",
  INDIFFERENT: "Ouvert(e) à tout",
};

const PROPOSAL_STATUS_LABELS = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
};

export default function CavaliersPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const msg = searchParams.get("msg");

  const [requests, setRequests] = useState<Request[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"demandes" | "candidatures">("demandes");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [proposalTarget, setProposalTarget] = useState<Request | null>(null);

  /* Formulaire création — ajout phoneNumber */
  const [form, setForm] = useState({
    title: "", message: "", photoUrl: "",
    genderPreference: "INDIFFERENT", phoneNumber: "",
  });

  /* Formulaire candidature — ajout phoneNumber */
  const [proposalMsg, setProposalMsg] = useState("");
  const [proposalPhone, setProposalPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, meRes, eventRes] = await Promise.all([
        fetch(`/api/escort?eventId=${eventId}`),
        fetch("/api/auth/session"),
        fetch(`/api/admin/events/${eventId}`),
      ]);
      const reqData = await reqRes.json();
      const meData = await meRes.json();
      const eventData = await eventRes.json();

      setRequests(reqData.requests ?? []);
      setEventTitle(eventData.event?.title ?? "Gala");

      if (meData?.user) {
        const myRequest = (reqData.requests ?? []).find(
          (r: Request) => r.requester.id === meData.user.id
        ) ?? null;

        const [matchRes, proposalsRes] = await Promise.all([
          fetch(`/api/escort/my-match?eventId=${eventId}`),
          fetch(`/api/escort/my-proposals?eventId=${eventId}`),
        ]);
        const matchData = await matchRes.json();
        const proposalsData = await proposalsRes.json();

        setCurrentUser({
          id: meData.user.id,
          name: meData.user.name,
          myRequest: myRequest ?? proposalsData.myRequest,
          hasMatch: matchData.hasMatch ?? false,
        });
        setProposals(proposalsData.proposals ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/escort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess("Votre demande a été publiée ✨");
      setShowCreateForm(false);
      setForm({ title: "", message: "", photoUrl: "", genderPreference: "INDIFFERENT", phoneNumber: "" });
      load();
    } catch { setError("Erreur réseau."); }
    finally { setSubmitting(false); }
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTarget) return;
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/escort/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: proposalTarget.id,
          message: proposalMsg,
          phoneNumber: proposalPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess("Votre candidature a été envoyée avec amour 💌");
      setProposalTarget(null);
      setProposalMsg("");
      setProposalPhone("");
    } catch { setError("Erreur réseau."); }
    finally { setSubmitting(false); }
  };

  const handleAccept = async (proposalId: string) => {
    setActionId(proposalId); setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/escort/proposals/${proposalId}/accept`, { method: "POST" });
      if (res.ok || res.redirected) {
        setSuccess("💑 C'est un match ! Vérifiez vos emails pour les coordonnées.");
        load();
      } else {
        const data = await res.json();
        setError(data.error ?? "Erreur.");
      }
    } catch { setError("Erreur réseau."); }
    finally { setActionId(null); }
  };

  const handleReject = async (proposalId: string) => {
    if (!confirm("Refuser cette candidature ?")) return;
    setActionId(proposalId); setError("");
    try {
      const res = await fetch(`/api/escort/proposals/${proposalId}/reject`, { method: "POST" });
      if (res.ok || res.redirected) { setSuccess("Candidature refusée."); load(); }
    } catch { setError("Erreur réseau."); }
    finally { setActionId(null); }
  };

  const handleDelete = async () => {
    if (!currentUser?.myRequest) return;
    if (!confirm("Retirer votre demande ?")) return;
    await fetch(`/api/escort?requestId=${currentUser.myRequest.id}`, { method: "DELETE" });
    load();
  };

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(d));

  const othersRequests = requests.filter((r) => r.requester.id !== currentUser?.id);
  const pendingProposals = proposals.filter((p) => p.status === "PENDING");

  /* ─── Champ téléphone réutilisable ─────────────────────────── */
  const PhoneField = ({
    value, onChange, label = "Numéro de téléphone (partagé uniquement lors du match)",
  }: { value: string; onChange: (v: string) => void; label?: string }) => (
    <div className={styles.formGroup}>
      <label className={styles.formLabel} style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Phone size={13} /> {label}
      </label>
      <input
        className={styles.formInput}
        type="tel"
        placeholder="Ex: 77 123 45 67"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p style={{ fontSize: "0.72rem", color: "#a4133c", marginTop: 4, fontStyle: "italic" }}>
        Optionnel — visible uniquement par votre cavalier / cavalière après le match.
      </p>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.heroIcon}>🌹</span>
        <h1 className={styles.heroTitle}>Trouver son cavalier / sa cavalière</h1>
        <p className={styles.heroSub}>{eventTitle} · Rencontres & mise en relation</p>
      </div>

      <div className="container">
        <div className={styles.content}>

          {msg === "matched" && (
            <div className={styles.matchAlert}>
              <div className={styles.matchAlertTitle}>💑 C&apos;est un match !</div>
              <div className={styles.matchAlertText}>Vérifiez votre email — nous vous avons envoyé les coordonnées de votre cavalier / cavalière.</div>
            </div>
          )}
          {success && (
            <div style={{ background: "#fff0f5", border: "1px solid #ffb3c6", borderRadius: "var(--radius-lg)", padding: "12px 16px", marginBottom: 20, fontSize: "0.875rem", color: "#800f2f", display: "flex", alignItems: "center", gap: 8 }}>
              <Heart size={15} fill="#c9184a" color="#c9184a" /> {success}
            </div>
          )}

          {/* Mon statut */}
          {currentUser && (
            <div className={styles.myStatus}>
              <div>
                {currentUser.hasMatch ? (
                  <>
                    <div className={styles.myStatusText}>💑 Vous avez déjà trouvé votre cavalier / cavalière</div>
                    <div className={styles.myStatusSub}>Vérifiez vos emails pour les coordonnées.</div>
                  </>
                ) : currentUser.myRequest ? (
                  <>
                    <div className={styles.myStatusText}>🌹 Votre demande est publiée</div>
                    <div className={styles.myStatusSub}>
                      {pendingProposals.length > 0
                        ? `${pendingProposals.length} candidature${pendingProposals.length > 1 ? "s" : ""} en attente`
                        : "Aucune candidature reçue pour le moment."}
                    </div>
                  </>
                ) : (
                  <div className={styles.myStatusText}>Vous n&apos;avez pas encore publié de demande.</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!currentUser.hasMatch && !currentUser.myRequest && (
                  <button className={styles.btnRomantic} onClick={() => setShowCreateForm(true)}>
                    <Heart size={15} fill="white" /> Publier ma demande
                  </button>
                )}
                {currentUser.myRequest && !currentUser.hasMatch && pendingProposals.length > 0 && (
                  <button className={styles.btnRomantic} onClick={() => setActiveTab("candidatures")} style={{ position: "relative" }}>
                    <Inbox size={15} /> Voir les candidatures
                    <span style={{ position: "absolute", top: -6, right: -6, background: "#c9184a", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {pendingProposals.length}
                    </span>
                  </button>
                )}
                {currentUser.myRequest && !currentUser.hasMatch && (
                  <button className={styles.btnRomanticGhost} onClick={handleDelete}>
                    <Trash2 size={14} /> Retirer
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Onglets */}
          {currentUser?.myRequest && (
            <div style={{ display: "flex", gap: 0, marginBottom: 28, border: "1.5px solid #ffb3c6", borderRadius: "999px", overflow: "hidden", width: "fit-content", background: "#fff0f5" }}>
              {[
                { key: "demandes", label: "Demandes", icon: <Users size={14} />, count: othersRequests.length },
                { key: "candidatures", label: "Candidatures reçues", icon: <Inbox size={14} />, count: pendingProposals.length },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as "demandes" | "candidatures")}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", background: activeTab === tab.key ? "linear-gradient(135deg,#c9184a,#e05c8a)" : "transparent", color: activeTab === tab.key ? "#fff" : "#c9184a", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, transition: "all 0.15s" }}>
                  {tab.icon} {tab.label}
                  {tab.count > 0 && (
                    <span style={{ background: activeTab === tab.key ? "rgba(255,255,255,0.25)" : "#c9184a", color: "#fff", borderRadius: 999, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Contenu onglets */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Loader2 size={28} style={{ animation: "spin 0.7s linear infinite", color: "#c9184a" }} />
            </div>
          ) : activeTab === "demandes" ? (
            othersRequests.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🕯️</span>
                <div className={styles.emptyTitle}>Aucune demande pour le moment</div>
                <p className={styles.emptyText}>Soyez le premier ou la première à publier votre demande.</p>
                {currentUser && !currentUser.myRequest && !currentUser.hasMatch && (
                  <button className={styles.btnRomantic} onClick={() => setShowCreateForm(true)}>
                    <Heart size={15} fill="white" /> Publier ma demande
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.grid}>
                {othersRequests.map((req) => (
                  <div key={req.id} className={styles.card}>
                    <div className={styles.cardRoseLine} />
                    <div className={styles.cardBody}>
                      <div className={styles.cardHeader}>
                        {req.photoUrl ? (
                          <Image src={req.photoUrl} alt={req.requester.name} width={56} height={56} className={styles.cardPhoto} />
                        ) : (
                          <div className={styles.cardPhotoPlaceholder}>💫</div>
                        )}
                        <div>
                          <div className={styles.cardName}>{req.requester.name}</div>
                          <div className={styles.cardMeta}>
                            {[req.requester.filiere, req.requester.promotion].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                      </div>
                      <div className={styles.cardTitle}>{req.title}</div>
                      <div className={styles.cardMessage}>{req.message}</div>
                      <div className={styles.cardGender}>
                        <Heart size={11} fill="#c9184a" color="#c9184a" />
                        {GENDER_LABELS[req.genderPreference]}
                      </div>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardDate}>{formatDate(req.createdAt)}</span>
                      {currentUser && !currentUser.hasMatch && !currentUser.myRequest && (
                        <button className={styles.btnRomantic} style={{ padding: "8px 18px", fontSize: "0.82rem" }}
                          onClick={() => { setProposalTarget(req); setError(""); }}>
                          <Send size={13} /> Je suis intéressé(e)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            proposals.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>💌</span>
                <div className={styles.emptyTitle}>Aucune candidature reçue</div>
                <p className={styles.emptyText}>Les candidatures apparaîtront ici dès qu&apos;un(e) étudiant(e) s&apos;intéressera à vous.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {proposals.map((proposal) => (
                  <div key={proposal.id} style={{ background: proposal.status === "ACCEPTED" ? "#fff0f5" : proposal.status === "REJECTED" ? "#fafafa" : "#ffffff", border: `1.5px solid ${proposal.status === "ACCEPTED" ? "#c9184a" : proposal.status === "REJECTED" ? "#e5e7eb" : "#ffb3c6"}`, borderRadius: "var(--radius-xl)", overflow: "hidden", opacity: proposal.status === "REJECTED" ? 0.6 : 1, boxShadow: "0 4px 16px rgba(180,30,60,0.07)" }}>
                    <div style={{ height: 3, background: proposal.status === "ACCEPTED" ? "linear-gradient(90deg,#c9184a,#e05c8a)" : "#f5d0de" }} />
                    <div style={{ padding: "20px 22px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                        {proposal.proposer.image ? (
                          <Image src={proposal.proposer.image} alt="" width={52} height={52} style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid #ffb3c6", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#ffb3c6,#ff758f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: "2px solid #ffb3c6" }}>💫</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: "#590d22", fontSize: "0.95rem", marginBottom: 2 }}>{proposal.proposer.name}</div>
                          <div style={{ fontSize: "0.78rem", color: "#a4133c", fontWeight: 600 }}>
                            {[proposal.proposer.filiere, proposal.proposer.promotion].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <span style={{ padding: "3px 12px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, background: proposal.status === "ACCEPTED" ? "rgba(201,24,74,0.1)" : proposal.status === "REJECTED" ? "rgba(107,114,128,0.1)" : "rgba(255,179,198,0.3)", color: proposal.status === "ACCEPTED" ? "#c9184a" : proposal.status === "REJECTED" ? "#6b7280" : "#800f2f", flexShrink: 0 }}>
                          {PROPOSAL_STATUS_LABELS[proposal.status]}
                        </span>
                      </div>
                      <div style={{ background: "#fff8fb", border: "1px solid #fde8f0", borderRadius: "var(--radius-md)", padding: "14px 16px", fontSize: "0.875rem", color: "#6b2737", lineHeight: 1.7, fontStyle: "italic", marginBottom: 16 }}>
                        <span style={{ color: "#ffb3c6", fontSize: "1.2em" }}>&ldquo;</span>{proposal.message}<span style={{ color: "#ffb3c6", fontSize: "1.2em" }}>&rdquo;</span>
                      </div>
                      {proposal.status === "PENDING" && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <button className={styles.btnRomantic} style={{ flex: 1, justifyContent: "center" }} onClick={() => handleAccept(proposal.id)} disabled={actionId === proposal.id}>
                            {actionId === proposal.id ? <Loader2 size={14} /> : <CheckCircle2 size={14} />} Accepter
                          </button>
                          <button className={styles.btnRomanticGhost} style={{ flex: 1, justifyContent: "center" }} onClick={() => handleReject(proposal.id)} disabled={actionId === proposal.id}>
                            <XCircle size={14} /> Refuser
                          </button>
                        </div>
                      )}
                      {proposal.status === "ACCEPTED" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(201,24,74,0.07)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", color: "#c9184a", fontWeight: 600 }}>
                          <Heart size={14} fill="#c9184a" color="#c9184a" /> Match confirmé — coordonnées envoyées par email
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "8px 22px 12px", fontSize: "0.75rem", color: "#d4a0b0" }}>{formatDate(proposal.createdAt)}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal création demande */}
      {showCreateForm && (
        <div className={styles.formOverlay} onClick={() => setShowCreateForm(false)}>
          <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formModalTitle}>🌹 Publiez votre demande</div>
            <div className={styles.formModalSub}>Partagez qui vous êtes et ce que vous recherchez.</div>
            {error && <div style={{ color: "#c9184a", fontSize: "0.85rem", marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Titre accrocheur *</label>
                <input className={styles.formInput} required placeholder="Ex: À la recherche d'une soirée inoubliable..."
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Votre message *</label>
                <textarea className={styles.formTextarea} required rows={4}
                  placeholder="Parlez de vous, de vos attentes..."
                  value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Je cherche…</label>
                <select className={styles.formSelect} value={form.genderPreference}
                  onChange={(e) => setForm({ ...form, genderPreference: e.target.value })}>
                  <option value="INDIFFERENT">Peu importe</option>
                  <option value="HOMME">Un cavalier</option>
                  <option value="FEMME">Une cavalière</option>
                </select>
              </div>
              {/* Numéro de téléphone */}
              <PhoneField value={form.phoneNumber} onChange={(v) => setForm({ ...form, phoneNumber: v })} />
              <div className={styles.formGroup}>
                <ImageUpload value={form.photoUrl} onChange={(url) => setForm({ ...form, photoUrl: url })} label="Photo (optionnelle)" />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnRomantic} style={{ flex: 1, justifyContent: "center" }} disabled={submitting}>
                  {submitting ? <Loader2 size={15} /> : <Heart size={15} fill="white" />}
                  {submitting ? "Publication…" : "Publier ma demande"}
                </button>
                <button type="button" className={styles.btnRomanticGhost} onClick={() => setShowCreateForm(false)}>
                  <X size={14} /> Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal candidature */}
      {proposalTarget && (
        <div className={styles.formOverlay} onClick={() => setProposalTarget(null)}>
          <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formModalTitle}>💌 Envoyer ma candidature</div>
            <div className={styles.formModalSub}>Écrivez un message sincère et romantique.</div>
            <div className={styles.proposalTarget}>
              {proposalTarget.photoUrl
                ? <Image src={proposalTarget.photoUrl} alt="" width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover" }} />
                : <span style={{ fontSize: 24 }}>💫</span>
              }
              <div>
                <div className={styles.proposalTargetName}>{proposalTarget.requester.name}</div>
                <div className={styles.proposalTargetTitle}>{proposalTarget.title}</div>
              </div>
            </div>
            {error && <div style={{ color: "#c9184a", fontSize: "0.85rem", marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handlePropose}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Votre message *</label>
                <textarea className={styles.formTextarea} required rows={5}
                  placeholder="Présentez-vous et expliquez pourquoi vous seriez le/la partenaire idéal(e)..."
                  value={proposalMsg} onChange={(e) => setProposalMsg(e.target.value)} />
              </div>
              {/* Numéro de téléphone du candidat */}
              <PhoneField value={proposalPhone} onChange={setProposalPhone} />
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnRomantic} style={{ flex: 1, justifyContent: "center" }} disabled={submitting}>
                  {submitting ? <Loader2 size={15} /> : <Send size={15} />}
                  {submitting ? "Envoi…" : "Envoyer ma candidature"}
                </button>
                <button type="button" className={styles.btnRomanticGhost} onClick={() => setProposalTarget(null)}>
                  <X size={14} /> Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}