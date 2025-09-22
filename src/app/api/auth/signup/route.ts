import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema/users";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, email, password } = body;

		// Validate input
		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required" },
				{ status: 400 }
			);
		}

		if (password.length < 8) {
			return NextResponse.json(
				{ error: "Password must be at least 8 characters long" },
				{ status: 400 }
			);
		}

		// Check if user already exists
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existingUser.length > 0) {
			return NextResponse.json(
				{ error: "User with this email already exists" },
				{ status: 409 }
			);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create user
		const newUser = await db
			.insert(users)
			.values({
				name: name || email.split("@")[0],
				email,
				password: hashedPassword,
				role: "reader", // Default role for new users
			})
			.returning({
				id: users.id,
				email: users.email,
				name: users.name,
				role: users.role,
			});

		if (newUser.length === 0) {
			throw new Error("Failed to create user");
		}

		return NextResponse.json({
			success: true,
			user: {
				id: newUser[0].id,
				email: newUser[0].email,
				name: newUser[0].name,
				role: newUser[0].role,
			},
		});

	} catch (error) {
		console.error("Signup error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}