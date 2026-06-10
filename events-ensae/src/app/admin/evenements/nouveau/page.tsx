// src/app/admin/evenements/nouveau/page.tsx
import { requireAdmin } from "@/lib/session";
import { AdminNav } from "../../AdminNav";
import { EventForm } from "../EventForm";
import styles from "../../admin.module.css";
import { Plus } from "lucide-react";

export const metadata = { title: "Nouvel événement | Admin ENSAE" };

export default async function NouvelEvenementPage() {
    await requireAdmin();

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <div className="container">
                    <div className={styles.eyebrow}><Plus size={13} /> Création</div>
                    <h1 className={styles.pageTitle}>Nouvel événement</h1>
                    <p className={styles.pageSubtitle}>Remplissez les informations ci-dessous et publiez l&apos;événement.</p>
                </div>
            </div>
            <div className="container">
                <AdminNav />
                <EventForm />
            </div>
        </div>
    );
}