"use client";
// src/components/ui/ImageUpload.tsx

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

type Props = {
    value: string;           // URL actuelle (imageUrl)
    onChange: (url: string) => void;
    label?: string;
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
const MAX_SIZE_MB = 5;

export function ImageUpload({ value, onChange, label = "Image de l'événement" }: Props) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const uploadFile = useCallback(async (file: File) => {
        setError("");

        // Vérifications
        if (!file.type.startsWith("image/")) {
            setError("Seules les images sont acceptées (JPG, PNG, WebP…)");
            return;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`L'image ne doit pas dépasser ${MAX_SIZE_MB} MB.`);
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);
            formData.append("folder", "ensae-events");

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                { method: "POST", body: formData }
            );

            if (!res.ok) throw new Error("Erreur lors de l'upload.");

            const data = await res.json();
            // URL optimisée automatiquement par Cloudinary
            const optimizedUrl = data.secure_url.replace(
                "/upload/",
                "/upload/f_auto,q_auto,w_1400/"
            );
            onChange(optimizedUrl);
        } catch {
            setError("Impossible d'uploader l'image. Réessayez.");
        } finally {
            setUploading(false);
        }
    }, [onChange]);

    const handleFile = (file: File | undefined) => {
        if (file) uploadFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label className="form-label">{label}</label>

            {/* Zone de drop / preview */}
            {value ? (
                /* Preview de l'image uploadée */
                <div style={{
                    position: "relative",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    border: "1px solid var(--border-medium)",
                    aspectRatio: "16/9",
                    background: "var(--bg-base)",
                }}>
                    <Image
                        src={value}
                        alt="Aperçu"
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 768px) 100vw, 600px"
                    />
                    {/* Overlay avec bouton supprimer */}
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0)",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-end",
                        padding: "10px",
                        transition: "background 0.2s",
                    }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.35)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
                    >
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: "32px", height: "32px",
                                borderRadius: "50%",
                                background: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                transition: "background 0.15s",
                            }}
                            title="Supprimer l'image"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                /* Zone de drop */
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                        border: `2px dashed ${dragOver ? "var(--color-accent)" : "var(--border-medium)"}`,
                        borderRadius: "var(--radius-lg)",
                        padding: "40px 24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                        cursor: uploading ? "not-allowed" : "pointer",
                        background: dragOver ? "var(--color-accent-50)" : "var(--bg-base)",
                        transition: "all 0.2s",
                        textAlign: "center",
                    }}
                >
                    {uploading ? (
                        <>
                            <Loader2 size={32} color="var(--color-accent)" style={{ animation: "spin 0.7s linear infinite" }} />
                            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Upload en cours…</p>
                        </>
                    ) : (
                        <>
                            <div style={{
                                width: "48px", height: "48px",
                                borderRadius: "var(--radius-lg)",
                                background: "var(--color-accent-50)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--color-accent)",
                            }}>
                                {dragOver ? <ImageIcon size={24} /> : <Upload size={24} />}
                            </div>
                            <div>
                                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                                    {dragOver ? "Déposez l'image ici" : "Cliquez ou glissez une image"}
                                </p>
                                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                    JPG, PNG, WebP — max {MAX_SIZE_MB} MB
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Erreur */}
            {error && (
                <p style={{ fontSize: "0.8rem", color: "var(--color-error)", display: "flex", alignItems: "center", gap: "5px" }}>
                    {error}
                </p>
            )}

            {/* Input file caché */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files?.[0])}
                disabled={uploading}
            />

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}