import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "./db"
import { sql } from "drizzle-orm"

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
        session.user.id = token.sub
        // Get user role from token
        session.user.role = token.role || 'user'
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        // When user signs in, fetch their role from the database
        try {
          const result = await db.execute(
            sql`SELECT role FROM users WHERE email = ${user.email} LIMIT 1`
          )

          const userRole = result[0]?.role
          token.role = userRole === 'ADMIN' ? 'admin' : 'user'
        } catch (error) {
          console.error('Error fetching user role:', error)
          token.role = 'user'
        }
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
})