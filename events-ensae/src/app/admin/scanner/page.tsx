"use client";
// src/app/admin/scanner/page.tsx
// Mise à jour : affiche le type de billet dans le panneau résultat

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import Link from "next/link";
import {
    QrCode, Search, CheckCircle2, XCircle, AlertTriangle,
    Clock, Camera, CameraOff, ArrowLeft, RotateCcw, User,
    Calendar, Tag,
} from "lucide-react";
import { AdminNav } from "../AdminNav";
import styles from "../admin.module.css";
import scanStyles from "./scanner.module.css";

type ScanResult = {
    ok: boolean;
    code: "VALID" | "ALREADY_SCANNED" | "NOT_FOUND" | "CANCELLED" | "PENDING" | "WRONG_EVENT";
    message: string;
    ticket?: TicketInfo;
};

type TicketInfo = {
    id: string;
    qrCode: string;
    status: string;
    createdAt: string;
    event: { id: string; title: string; date: string; time: string; location?: string };
    user: { name: string; email: string; filiere: string | null; promotion: string | null };
    ticketType: { name: string; description: string | null; price: number } | null;
};

type Event = { id: string; title: string };

export default function ScannerPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState("");

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animRef = useRef<number>(0);
    const lastScannedRef = useRef<string>("");
    const cooldownRef = useRef(false);

    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [result, setResult] = useState<ScanResult | null>(null);
    const [scanning, setScanning] = useState(false);
    const [mode, setMode] = useState<"camera" | "manual">("camera");
    const [manualQ, setManualQ] = useState("");
    const [manualResults, setManualResults] = useState<TicketInfo[]>([]);
    const [manualLoading, setManualLoading] = useState(false);

    useEffect(() => {
        fetch("/api/admin/events")
            .then((r) => r.json())
            .then((d) => setEvents(d.events ?? []));
    }, []);

    const startCamera = useCallback(async () => {
        setCameraError("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraActive(true);
        } catch {
            setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions du navigateur.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        cancelAnimationFrame(animRef.current);
        setCameraActive(false);
    }, []);

    useEffect(() => {
        if (mode === "camera") startCamera();
        else stopCamera();
        return () => stopCamera();
    }, [mode, startCamera, stopCamera]);

    const handleScan = useCallback(async (qrRaw: string) => {
        setScanning(true); setResult(null);
        try {
            const res = await fetch("/api/admin/scanner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qrRaw, eventId: selectedEventId || undefined }),
            });
            const data: ScanResult = await res.json();
            setResult(data);
        } catch {
            setResult({ ok: false, code: "NOT_FOUND", message: "Erreur réseau, réessayez." });
        } finally {
            setScanning(false);
        }
    }, [selectedEventId]);

    useEffect(() => {
        if (!cameraActive) return;
        const scan = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
                animRef.current = requestAnimationFrame(scan); return;
            }
            const ctx = canvas.getContext("2d");
            if (!ctx) { animRef.current = requestAnimationFrame(scan); return; }
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code?.data && !cooldownRef.current && code.data !== lastScannedRef.current) {
                lastScannedRef.current = code.data;
                cooldownRef.current = true;
                handleScan(code.data);
                setTimeout(() => { cooldownRef.current = false; }, 3000);
            }
            animRef.current = requestAnimationFrame(scan);
        };
        animRef.current = requestAnimationFrame(scan);
        return () => cancelAnimationFrame(animRef.current);
    }, [cameraActive, handleScan]);

    useEffect(() => {
        if (mode !== "manual" || manualQ.trim().length < 2) { setManualResults([]); return; }
        const t = setTimeout(async () => {
            setManualLoading(true);
            try {
                const params = new URLSearchParams({ q: manualQ });
                if (selectedEventId) params.set("eventId", selectedEventId);
                const res = await fetch(`/api/admin/scanner?${params}`);
                const data = await res.json();
                setManualResults(data.tickets ?? []);
            } finally { setManualLoading(false); }
        }, 300);
        return () => clearTimeout(t);
    }, [manualQ, mode, selectedEventId]);

    const resetResult = () => { setResult(null); lastScannedRef.current = ""; cooldownRef.current = false; };

    const resultConfig = result
        ? ({
            VALID: { bg: scanStyles.resultValid, icon: <CheckCircle2 size={40} />, label: "Entrée autorisée" },
            ALREADY_SCANNED: { bg: scanStyles.resultWarning, icon: <AlertTriangle size={40} />, label: "Déjà utilisé" },
            NOT_FOUND: { bg: scanStyles.resultError, icon: <XCircle size={40} />, label: "Billet inconnu" },
            CANCELLED: { bg: scanStyles.resultError, icon: <XCircle size={40} />, label: "Billet annulé" },
            PENDING: { bg: scanStyles.resultWarning, icon: <Clock size={40} />, label: "Paiement en attente" },
            WRONG_EVENT: { bg: scanStyles.resultWarning, icon: <AlertTriangle size={40} />, label: "Mauvais événement" },
        } as const)[result.code] ?? { bg: scanStyles.resultError, icon: <XCircle size={40} />, label: "Erreur" }
        : null;

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <div className={styles.pageHeaderInner}>
                        <div>
                            <div className={styles.eyebrow}><QrCode size={13} /> Contrôle d&apos;accès</div>
                            <h1 className={styles.pageTitle}>Scanner QR</h1>
                            <p className={styles.pageSubtitle}>Validez les billets à l&apos;entrée de l&apos;événement.</p>
                        </div>
                        <div className={styles.pageActions}>
                            <Link href="/admin" className="btn btn-ghost btn-sm">
                                <ArrowLeft size={14} /> Tableau de bord
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <AdminNav />

                <div className={scanStyles.eventSelect}>
                    <label className={scanStyles.eventSelectLabel}><Calendar size={14} /> Filtrer par événement (optionnel)</label>
                    <select className={styles.filterSelect} value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                        <option value="">Tous les événements</option>
                        {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                </div>

                <div className={scanStyles.modeToggle}>
                    <button className={`${scanStyles.modeBtn} ${mode === "camera" ? scanStyles.modeBtnActive : ""}`}
                        onClick={() => { setMode("camera"); resetResult(); }}>
                        <Camera size={15} /> Caméra
                    </button>
                    <button className={`${scanStyles.modeBtn} ${mode === "manual" ? scanStyles.modeBtnActive : ""}`}
                        onClick={() => { setMode("manual"); resetResult(); }}>
                        <Search size={15} /> Recherche manuelle
                    </button>
                </div>

                <div className={scanStyles.layout}>
                    {/* Zone caméra / recherche */}
                    <div className={scanStyles.scanArea}>
                        {mode === "camera" ? (
                            <div className={scanStyles.cameraWrap}>
                                {cameraError ? (
                                    <div className={scanStyles.cameraError}>
                                        <CameraOff size={36} /><p>{cameraError}</p>
                                        <button className="btn btn-secondary" onClick={startCamera}><Camera size={14} /> Réessayer</button>
                                    </div>
                                ) : (
                                    <>
                                        <video ref={videoRef} className={scanStyles.video} playsInline muted autoPlay />
                                        <canvas ref={canvasRef} style={{ display: "none" }} />
                                        <div className={scanStyles.scanOverlay}>
                                            <div className={scanStyles.scanFrame}>
                                                <span className={`${scanStyles.corner} ${scanStyles.cornerTL}`} />
                                                <span className={`${scanStyles.corner} ${scanStyles.cornerTR}`} />
                                                <span className={`${scanStyles.corner} ${scanStyles.cornerBL}`} />
                                                <span className={`${scanStyles.corner} ${scanStyles.cornerBR}`} />
                                                {scanning && <div className={scanStyles.scanLine} />}
                                            </div>
                                            <p className={scanStyles.scanHint}>
                                                {scanning ? "Validation en cours…" : "Placez le QR code dans le cadre"}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className={scanStyles.manualSearch}>
                                <div className={styles.searchWrap} style={{ maxWidth: "100%" }}>
                                    <Search size={15} className={styles.searchIcon} />
                                    <input className={styles.searchInput} placeholder="Nom, email ou code billet…"
                                        value={manualQ} onChange={(e) => setManualQ(e.target.value)} autoFocus />
                                </div>
                                {manualLoading && <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "12px 0" }}>Recherche…</p>}
                                {!manualLoading && manualQ.length >= 2 && manualResults.length === 0 && (
                                    <div className={scanStyles.noResults}><XCircle size={20} /><span>Aucun billet trouvé pour &quot;{manualQ}&quot;</span></div>
                                )}
                                {manualResults.length > 0 && (
                                    <div className={scanStyles.manualList}>
                                        {manualResults.map((t) => (
                                            <div key={t.id} className={scanStyles.manualItem}>
                                                <div className={scanStyles.manualItemInfo}>
                                                    <div className={scanStyles.manualItemName}><User size={13} /> {t.user.name}</div>
                                                    <div className={scanStyles.manualItemMeta}>{t.user.email}</div>
                                                    <div className={scanStyles.manualItemMeta}>{t.event.title}</div>
                                                    {/* Type de billet */}
                                                    {t.ticketType && (
                                                        <div style={{
                                                            display: "inline-flex", alignItems: "center", gap: 4,
                                                            marginTop: 4, padding: "2px 8px",
                                                            background: "rgba(79,70,229,0.08)",
                                                            borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, color: "#4338ca",
                                                        }}>
                                                            <Tag size={10} /> {t.ticketType.name}
                                                        </div>
                                                    )}
                                                    <div style={{ marginTop: 6 }}><StatusBadge status={t.status} /></div>
                                                </div>
                                                <button className="btn btn-primary btn-sm"
                                                    onClick={() => handleScan(t.qrCode)}
                                                    disabled={t.status !== "CONFIRMED"} style={{ flexShrink: 0 }}>
                                                    {t.status === "CONFIRMED" ? "Valider" : "—"}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Panneau résultat */}
                    <div className={scanStyles.resultArea}>
                        {!result && !scanning && (
                            <div className={scanStyles.resultIdle}>
                                <QrCode size={48} strokeWidth={1} /><p>En attente d&apos;un scan</p>
                            </div>
                        )}
                        {scanning && (
                            <div className={scanStyles.resultIdle}>
                                <div className={scanStyles.spinner} /><p>Validation…</p>
                            </div>
                        )}
                        {result && resultConfig && (
                            <div className={`${scanStyles.resultCard} ${resultConfig.bg}`}>
                                <div className={scanStyles.resultIcon}>{resultConfig.icon}</div>
                                <div className={scanStyles.resultLabel}>{resultConfig.label}</div>
                                <div className={scanStyles.resultMessage}>{result.message}</div>

                                {result.ticket && (
                                    <div className={scanStyles.ticketDetail}>
                                        <div className={scanStyles.ticketDetailRow}>
                                            <span className={scanStyles.ticketDetailKey}>Nom</span>
                                            <span className={scanStyles.ticketDetailVal}>{result.ticket.user.name}</span>
                                        </div>
                                        <div className={scanStyles.ticketDetailRow}>
                                            <span className={scanStyles.ticketDetailKey}>Email</span>
                                            <span className={scanStyles.ticketDetailVal}>{result.ticket.user.email}</span>
                                        </div>
                                        {result.ticket.user.filiere && (
                                            <div className={scanStyles.ticketDetailRow}>
                                                <span className={scanStyles.ticketDetailKey}>Filière</span>
                                                <span className={scanStyles.ticketDetailVal}>
                                                    {[result.ticket.user.filiere, result.ticket.user.promotion].filter(Boolean).join(" · ")}
                                                </span>
                                            </div>
                                        )}
                                        {/* ── Type de billet ── */}
                                        {result.ticket.ticketType && (
                                            <div className={scanStyles.ticketDetailRow}
                                                style={{ background: "rgba(79,70,229,0.07)", borderRadius: 6, margin: "4px 0" }}>
                                                <span className={scanStyles.ticketDetailKey} style={{ color: "#4338ca" }}>
                                                    <Tag size={11} style={{ display: "inline", marginRight: 3 }} />
                                                    Type
                                                </span>
                                                <span className={scanStyles.ticketDetailVal} style={{ fontWeight: 700, color: "#4338ca" }}>
                                                    {result.ticket.ticketType.name}
                                                    {result.ticket.ticketType.price > 0 && (
                                                        <span style={{ fontWeight: 500, opacity: 0.75, marginLeft: 6 }}>
                                                            {result.ticket.ticketType.price.toLocaleString("fr-FR")} FCFA
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <div className={scanStyles.ticketDetailRow}>
                                            <span className={scanStyles.ticketDetailKey}>Événement</span>
                                            <span className={scanStyles.ticketDetailVal}>{result.ticket.event.title}</span>
                                        </div>
                                        <div className={scanStyles.ticketDetailRow}>
                                            <span className={scanStyles.ticketDetailKey}>Date</span>
                                            <span className={scanStyles.ticketDetailVal}>
                                                {result.ticket.event.date} à {result.ticket.event.time}
                                            </span>
                                        </div>
                                        <div className={scanStyles.ticketDetailRow}>
                                            <span className={scanStyles.ticketDetailKey}>Réf.</span>
                                            <span className={scanStyles.ticketDetailVal} style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
                                                {result.ticket.qrCode.slice(0, 8)}…
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <button className={scanStyles.resetBtn} onClick={resetResult}>
                                    <RotateCcw size={14} /> Scanner le suivant
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { label: string; style: React.CSSProperties }> = {
        CONFIRMED: { label: "Confirmé", style: { background: "rgba(31,107,71,0.12)", color: "#15803d" } },
        SCANNED: { label: "Utilisé", style: { background: "rgba(113,113,122,0.12)", color: "#52525B" } },
        PENDING: { label: "En attente", style: { background: "rgba(217,119,6,0.12)", color: "#b45309" } },
        PENDING_REVIEW: { label: "Paiement vérif.", style: { background: "rgba(217,119,6,0.12)", color: "#b45309" } },
        CANCELLED: { label: "Annulé", style: { background: "rgba(220,38,38,0.10)", color: "#b91c1c" } },
    };
    const c = cfg[status] ?? cfg.CANCELLED;
    return (
        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, ...c.style }}>
            {c.label}
        </span>
    );
}