import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const SEED_EVENTS = [
  {
    title: "Dîner de Gala ENSAE 2026",
    description:
      "La grande soirée annuelle de l'ENSAE Dakar réunit étudiants, alumni et invités autour d'un dîner, d'une cérémonie et d'une playlist choisie par la communauté.",
    category: "GALA" as const,
    date: new Date("2026-12-19T20:00:00"),
    location: "King Fahd Palace, Dakar",
    imageUrl:
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=80",
    price: 25000,
    capacity: 220,
    deadline: new Date("2026-12-12T23:59:00"),
    published: true,
    tags: ["gala", "alumni", "soirée"],
  },
  {
    title: "Championnat Inter-Promotion Football",
    description:
      "Tournoi sportif entre promotions avec phases de groupe, finale et remise de trophée sur le campus.",
    category: "CHAMPIONNAT" as const,
    date: new Date("2026-08-08T16:00:00"),
    location: "Terrain ENSAE, Campus",
    imageUrl:
      "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=1400&q=80",
    price: 0,
    capacity: 180,
    deadline: new Date("2026-08-07T20:00:00"),
    published: true,
    tags: ["sport", "football", "campus"],
  },
  {
    title: "Sortie pédagogique à l'ANSD",
    description:
      "Visite guidée de l'Agence Nationale de la Statistique et de la Démographie avec échanges autour des métiers de la donnée publique.",
    category: "SORTIE_PEDAGOGIQUE" as const,
    date: new Date("2026-07-18T09:00:00"),
    location: "ANSD, Dakar",
    imageUrl:
      "https://images.unsplash.com/photo-1523580494112-071d16940a43?auto=format&fit=crop&w=1400&q=80",
    price: 5000,
    capacity: 60,
    deadline: new Date("2026-07-14T18:00:00"),
    published: true,
    tags: ["statistique", "visite", "professionnel"],
  },
  {
    title: "Conférence Data Careers",
    description:
      "Table ronde avec des diplômés de l'ENSAE sur les carrières en data science, économie quantitative, statistique publique et finance.",
    category: "CONFERENCE" as const,
    date: new Date("2026-09-26T10:00:00"),
    location: "Amphithéâtre ENSAE",
    imageUrl:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1400&q=80",
    price: 0,
    capacity: 120,
    deadline: null,
    published: true,
    tags: ["data", "alumni", "carrière"],
  },
];

async function main() {
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    await prisma.event.createMany({ data: SEED_EVENTS });
    console.log(`✓ ${SEED_EVENTS.length} événements créés`);
  } else {
    console.log(`→ ${eventCount} événement(s) déjà en base, seed événements ignoré`);
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  await prisma.user.upsert({
    where: { email: "admin@ensae.sn" },
    update: {},
    create: {
      name: "Admin ENSAE",
      email: "admin@ensae.sn",
      password: await bcrypt.hash(adminPassword, 12),
      emailVerified: new Date(),
      role: "ADMIN",
      filiere: "Administration",
      promotion: "2026",
    },
  });
  console.log("✓ Compte admin prêt (admin@ensae.sn)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
