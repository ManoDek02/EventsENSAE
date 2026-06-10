// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Domaines autorisés en dev (ngrok) — ignorés en prod */
  allowedDevOrigins: ["stoplight-devouring-deferral.ngrok-free.dev"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
      },
    ],
  },
};

export default nextConfig;