import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
	try {
		// Add password column to users table if it doesn't exist
		await db.execute(sql`
			ALTER TABLE "users"
			ADD COLUMN IF NOT EXISTS password TEXT
		`);

		return NextResponse.json({
			success: true,
			message: "Database updated successfully"
		});
	} catch (error) {
		console.error("Database setup error:", error);
		return NextResponse.json(
			{ error: "Failed to setup database", details: error },
			{ status: 500 }
		);
	}
}