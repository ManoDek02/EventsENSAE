import { defineConfig } from "prisma/config";
import { PrismaClient } from "@prisma/client";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  migrate: {
    async adapter() {
      const { neonConfig, Pool } = await import("@neondatabase/serverless");
      const { PrismaNeon } = await import("@prisma/adapter-neon");
      const { WebSocket } = await import("ws");

      neonConfig.webSocketConstructor = WebSocket;

      const pool = new Pool({
        connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
      });

      return new PrismaNeon(pool);
    },
  },
});
