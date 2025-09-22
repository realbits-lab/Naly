import { sql } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
		Credentials({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email", placeholder: "email@example.com" },
				password: { label: "Password", type: "password" }
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				try {
					// Fetch user from database
					const result = await db.execute(
						sql`SELECT id, email, name, image, password, role FROM users WHERE email = ${credentials.email} LIMIT 1`
					);

					if (!result[0]) {
						return null;
					}

					const user = result[0];

					// Check if user has a password (for credentials auth)
					if (!user.password) {
						return null;
					}

					// Verify password
					const isValid = await bcrypt.compare(credentials.password as string, user.password as string);

					if (!isValid) {
						return null;
					}

					// Return user object (without password)
					return {
						id: user.id as string,
						email: user.email as string,
						name: user.name as string,
						image: user.image as string,
						role: user.role as string,
					};
				} catch (error) {
					console.error("Error during authentication:", error);
					return null;
				}
			}
		})
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
			if (user) {
				// For credentials provider, user object already has the role
				if (account?.provider === "credentials") {
					token.dbUserId = user.id;
					token.role = user.role || "reader";
				}
				// For OAuth providers
				else if (account) {
					// When user signs in, fetch their ID and role from the database
					try {
						const result = await db.execute(
							sql`SELECT id, role FROM users WHERE email = ${user.email} LIMIT 1`,
						);

						if (result[0]) {
							const dbUser = result[0];
							token.dbUserId = dbUser.id;
							token.role = dbUser.role; // Use the role directly from the database
						} else {
							console.error("User not found in database:", user.email);
							token.role = "reader"; // Default to reader for new users
						}
					} catch (error) {
						console.error("Error fetching user from database:", error);
						token.role = "reader";
					}
				}
			}
			return token;
		},
	},
	pages: {
		signIn: "/auth/signin", // Custom sign-in page
	},
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	trustHost: true,
	debug: process.env.NODE_ENV === "development",
});