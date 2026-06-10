// src/middleware.ts
// Middleware Edge — utilise auth.config.ts (sans Prisma) pour rester sous 1 MB

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const AUTH_ROUTES = ["/profile", "/music"];
const ADMIN_ROUTES = ["/admin"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (matchesRoute(pathname, AUTH_ROUTES) && !session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    if (!session) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if ((session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/profile/:path*", "/music/:path*", "/admin/:path*"],
};