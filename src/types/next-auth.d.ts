import NextAuth from "next-auth";
import { AdapterUser } from "next-auth/adapters";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			role: string;
		};
	}

	interface User {
		role: string;
	}
}

declare module "next-auth/adapters" {
	interface AdapterUser {
		role: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		role: string;
	}
}
