// src/lib/auth.config.ts
// Configuration NextAuth compatible Edge Runtime (sans Prisma)
// Utilisé uniquement par le middleware

import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
    providers: [],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role;
                token.permissions = (user as { permissions?: string[] }).permissions ?? []; // ← ajouter
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as { role?: string }).role = token.role as string;
                (session.user as { permissions?: string[] }).permissions = token.permissions as string[] ?? []; // ← ajouter
            }
            return session;
        },
        authorized({ auth }) {
            return !!auth;
        },
    },
    pages: {
        signIn: "/auth/login",
        error: "/auth/error",
    },
    session: {
        strategy: "jwt",
    },
};