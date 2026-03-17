import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role: string }).role;
                token.id = user.id as string;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { role: string }).role = token.role as string;
                (session.user as { id: string }).id = token.id as string;
            }
            return session;
        },
    },
    providers: [], // Leave this array empty for now!
} satisfies NextAuthConfig;