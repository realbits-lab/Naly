import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
	try {
		// Check what tables exist
		const tables = await db.execute(sql`
			SELECT tablename
			FROM pg_tables
			WHERE schemaname = 'public'
			ORDER BY tablename
		`);

		// Check if users table exists
		const usersTableCheck = await db.execute(sql`
			SELECT EXISTS (
				SELECT FROM information_schema.tables
				WHERE table_schema = 'public'
				AND table_name = 'users'
			)
		`);

		return NextResponse.json({
			success: true,
			tables: tables,
			usersTableExists: usersTableCheck[0]?.exists
		});
	} catch (error) {
		console.error("Database check error:", error);
		return NextResponse.json(
			{ error: "Failed to check database", details: error },
			{ status: 500 }
		);
	}
}