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
			if (session.user && token) {
				// Use the database user ID instead of token.sub
				session.user.id = (typeof token.dbUserId === "string" ? token.dbUserId : null) || token.sub;
				// Get user role from token
				session.user.role = (typeof token.role === "string" ? token.role : null) || "user";
			}
			return session;
		},
		async jwt({ token, user, account }) {
			if (user && account) {
				// When user signs in, fetch their ID and role from the database
				try {
					const result = await db.execute(
						sql`SELECT id, role FROM users WHERE email = ${user.email} LIMIT 1`,
					);

					if (result[0]) {
						const dbUser = result[0];
						token.dbUserId = dbUser.id;
						token.role = dbUser.role === "ADMIN" ? "admin" : "user";
					} else {
						console.error("User not found in database:", user.email);
						token.role = "user";
					}
				} catch (error) {
					console.error("Error fetching user from database:", error);
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
