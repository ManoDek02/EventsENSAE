// src/app/admin/evenements/[id]/page.tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "../../AdminNav";
import { EventForm, EventFormData } from "../EventForm";
import styles from "../../admin.module.css";
import { Pencil } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id }, select: { title: true } });
    return { title: event ? `Modifier — ${event.title}` : "Événement introuvable" };
}

export default async function EditEventPage({ params }: Props) {
    await requireAdmin();
    const { id } = await params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) notFound();

    /* Convertir les dates en string datetime-local (format HTML input) */
    const toDatetimeLocal = (d: Date | null) => {
        if (!d) return "";
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16);
    };

    const initialData: Partial<EventFormData> = {
        title: event.title,
        description: event.description,
        category: event.category,
        date: toDatetimeLocal(event.date),
        location: event.location,
        imageUrl: event.imageUrl ?? "",
        price: String(event.price),
        capacity: String(event.capacity),
        deadline: toDatetimeLocal(event.deadline),
        published: event.published,
        tags: event.tags.join(", "),
        allowsMusicSuggestions: event.allowsMusicSuggestions,
    };

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <div className={styles.eyebrow}><Pencil size={13} /> Modification</div>
                    <h1 className={styles.pageTitle}>{event.title}</h1>
                    <p className={styles.pageSubtitle}>Modifiez les informations de l&apos;événement.</p>
                </div>
            </div>
            <div className="container">
                <AdminNav />
                <EventForm initialData={initialData} eventId={id} />
            </div>
        </div>
    );
}