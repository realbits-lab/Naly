import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cronJobs } from "@/lib/schema";

const createCronJobSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(1000).optional(),
	type: z.enum([
		"MARKET_ANALYSIS",
		"PORTFOLIO_UPDATE",
		"PREDICTION_REFRESH",
		"DATA_SYNC",
		"CUSTOM_TASK",
	]),
	cronExpression: z.string().min(1),
	taskConfig: z.record(z.any()).optional(),
});

export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const jobs = await db
			.select()
			.from(cronJobs);

		return NextResponse.json({ jobs });
	} catch (error) {
		console.error("Failed to fetch cron jobs:", error);
		return NextResponse.json(
			{ error: "Failed to fetch cron jobs" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = createCronJobSchema.parse(body);

		// Calculate next run time based on cron expression
		const nextRun = calculateNextRun(validatedData.cronExpression);

		const [newJob] = await db
			.insert(cronJobs)
			.values({
				name: validatedData.name,
				description: validatedData.description,
				type: validatedData.type,
				cronExpression: validatedData.cronExpression,
				taskConfig: validatedData.taskConfig || {},
				nextRun,
			})
			.returning();

		return NextResponse.json({ job: newJob }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input", details: error.errors },
				{ status: 400 },
			);
		}

		console.error("Failed to create cron job:", error);
		return NextResponse.json(
			{ error: "Failed to create cron job" },
			{ status: 500 },
		);
	}
}

function calculateNextRun(cronExpression: string): Date {
	// Simple implementation - in production, use a proper cron parser like node-cron
	const now = new Date();

	try {
		const parts = cronExpression.split(" ");
		if (parts.length !== 5) {
			throw new Error("Invalid cron expression");
		}

		const [minute, hour, day, month, dayOfWeek] = parts;

		// Handle hourly jobs (most common case)
		if (minute === "0" && hour === "*") {
			const nextRun = new Date(now);
			nextRun.setMinutes(0, 0, 0);
			if (nextRun <= now) {
				nextRun.setHours(nextRun.getHours() + 1);
			}
			return nextRun;
		}

		// Handle daily jobs at specific hour
		if (minute === "0" && !hour.includes("*") && !hour.includes("/")) {
			const targetHour = parseInt(hour, 10);
			const nextRun = new Date(now);
			nextRun.setHours(targetHour, 0, 0, 0);
			if (nextRun <= now) {
				nextRun.setDate(nextRun.getDate() + 1);
			}
			return nextRun;
		}

		// Default: run in 1 hour
		const nextRun = new Date(now.getTime() + 60 * 60 * 1000);
		return nextRun;
	} catch (error) {
		console.error("Failed to parse cron expression:", error);
		// Fallback: run in 1 hour
		return new Date(now.getTime() + 60 * 60 * 1000);
	}
}
