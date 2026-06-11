// src/middleware.ts
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const AUTH_ROUTES = ["/profile", "/music"];
const ADMIN_ROUTES = ["/admin"];

/* Mapping route → permission requise */
const ROUTE_PERMISSION_MAP: Array<{ prefix: string; permission: string }> = [
  { prefix: "/admin/evenements", permission: "MANAGE_EVENTS" },
  { prefix: "/admin/participants", permission: "MANAGE_PARTICIPANTS" },
  { prefix: "/admin/scanner", permission: "SCAN_QR" },
  { prefix: "/admin/musiques", permission: "MODERATE_MUSIC" },
  { prefix: "/admin/utilisateurs", permission: "MANAGE_USERS" },
];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const user = session?.user as { role?: string; permissions?: string[] } | undefined;

  /* ── Routes authentifiées ──────────────────────────────── */
  if (matchesRoute(pathname, AUTH_ROUTES) && !session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  /* ── Routes admin ──────────────────────────────────────── */
  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    if (!session) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const permissions: string[] = user?.permissions ?? [];
    const isSuperAdmin = permissions.includes("SUPER_ADMIN");

    /* Dashboard /admin — accessible à tout admin quel que soit ses permissions */
    if (pathname === "/admin") return NextResponse.next();

    /* Vérifier la permission spécifique à la route */
    if (!isSuperAdmin) {
      const routeRule = ROUTE_PERMISSION_MAP.find(
        (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
      );

      if (routeRule && !permissions.includes(routeRule.permission)) {
        return NextResponse.redirect(
          new URL("/admin?error=forbidden", req.url)
        );
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/profile/:path*", "/music/:path*", "/admin/:path*"],
};