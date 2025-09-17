import { sql } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
	],
	callbacks: {
		async session({ session, token }) {
			if (session.user && token && token.sub) {
				session.user.id = token.sub;
				// Get user role from token
				session.user.role = (typeof token.role === "string" ? token.role : null) || "user";
			}
			return session;
		},
		async jwt({ token, user, account }) {
			if (user && account) {
				// When user signs in, fetch their role from the database
				try {
					const result = await db.execute(
						sql`SELECT role FROM users WHERE email = ${user.email} LIMIT 1`,
					);

					const userRole = result[0]?.role;
					token.role = userRole === "ADMIN" ? "admin" : "user";
				} catch (error) {
					console.error("Error fetching user role:", error);
					token.role = "user";
				}
			}
			return token;
		},
	},
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	trustHost: true,
	debug: process.env.NODE_ENV === "development",
});
