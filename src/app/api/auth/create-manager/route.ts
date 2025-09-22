import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema/users";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
	try {
		// Generate random test credentials
		const randomId = Math.random().toString(36).substring(2, 10);
		const testEmail = `manager.${randomId}@test.naly.com`;
		const testPassword = `Manager${randomId.toUpperCase()}!2024`;
		const testName = `Test Manager ${randomId.toUpperCase()}`;

		// Check if user already exists
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.email, testEmail))
			.limit(1);

		if (existingUser.length > 0) {
			return NextResponse.json(
				{ error: "User already exists" },
				{ status: 409 }
			);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(testPassword, 12);

		// Create manager user
		const newUser = await db
			.insert(users)
			.values({
				name: testName,
				email: testEmail,
				password: hashedPassword,
				role: "manager", // Set as manager role
				emailVerified: new Date(), // Mark as verified
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

		// Return credentials for saving
		return NextResponse.json({
			success: true,
			user: {
				id: newUser[0].id,
				email: newUser[0].email,
				name: newUser[0].name,
				role: newUser[0].role,
			},
			credentials: {
				email: testEmail,
				password: testPassword, // Return plain password for testing purposes
			},
			message: "Manager account created successfully"
		});

	} catch (error) {
		console.error("Create manager error:", error);
		return NextResponse.json(
			{ error: "Internal server error", details: error },
			{ status: 500 }
		);
	}
}