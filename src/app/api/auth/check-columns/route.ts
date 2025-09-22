import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
	try {
		// Check columns in users table
		const columns = await db.execute(sql`
			SELECT column_name, data_type
			FROM information_schema.columns
			WHERE table_schema = 'public'
			AND table_name = 'users'
			ORDER BY ordinal_position
		`);

		return NextResponse.json({
			success: true,
			columns: columns
		});
	} catch (error) {
		console.error("Database check error:", error);
		return NextResponse.json(
			{ error: "Failed to check database", details: error },
			{ status: 500 }
		);
	}
}