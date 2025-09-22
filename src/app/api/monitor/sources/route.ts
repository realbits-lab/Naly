import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rssSources } from "@/lib/schema/rss";
import { eq } from "drizzle-orm";
import { DEFAULT_RSS_SOURCES } from "@/lib/constants/rss-sources";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/user";

export async function GET(request: NextRequest) {
	try {
		// Check authentication and authorization
		const session = await auth();

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized: Please sign in" },
				{ status: 401 }
			);
		}

		if (session.user.role !== UserRole.MANAGER) {
			return NextResponse.json(
				{ error: "Forbidden: Only managers can access this endpoint" },
				{ status: 403 }
			);
		}
		// Try to get sources from database
		let sources;
		try {
			sources = await db.select().from(rssSources).where(eq(rssSources.isActive, true));
		} catch (dbError) {
			// If database is not available, return default sources
			console.log("Database not available, using default RSS sources");
			sources = DEFAULT_RSS_SOURCES.map((source, index) => ({
				id: `default-${index}`,
				...source,
				createdAt: new Date(),
				updatedAt: new Date(),
				websiteUrl: null,
				language: "en",
				country: null,
				updateFrequency: 60,
				lastFetchedAt: null,
				lastSuccessfulFetch: null,
				fetchErrorCount: 0,
				lastFetchError: null,
			}));
		}

		// If no sources in database, seed with default sources
		if (sources.length === 0) {
			try {
				const insertedSources = await Promise.all(
					DEFAULT_RSS_SOURCES.map(source =>
						db.insert(rssSources).values(source).returning()
					)
				);
				sources = insertedSources.flat();
			} catch (seedError) {
				// If seeding fails, return default sources with IDs
				sources = DEFAULT_RSS_SOURCES.map((source, index) => ({
					id: `default-${index}`,
					...source,
					createdAt: new Date(),
					updatedAt: new Date(),
					websiteUrl: null,
					language: "en",
					country: null,
					updateFrequency: 60,
					lastFetchedAt: null,
					lastSuccessfulFetch: null,
					fetchErrorCount: 0,
					lastFetchError: null,
				}));
			}
		}

		return NextResponse.json(sources);
	} catch (error) {
		console.error("Error fetching RSS sources:", error);

		// Fallback to default sources
		const fallbackSources = DEFAULT_RSS_SOURCES.map((source, index) => ({
			id: `default-${index}`,
			...source,
			createdAt: new Date(),
			updatedAt: new Date(),
			websiteUrl: null,
			language: "en",
			country: null,
			updateFrequency: 60,
			lastFetchedAt: null,
			lastSuccessfulFetch: null,
			fetchErrorCount: 0,
			lastFetchError: null,
		}));

		return NextResponse.json(fallbackSources);
	}
}

export async function POST(request: NextRequest) {
	try {
		// Check authentication and authorization
		const session = await auth();

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized: Please sign in" },
				{ status: 401 }
			);
		}

		if (session.user.role !== UserRole.MANAGER) {
			return NextResponse.json(
				{ error: "Forbidden: Only managers can access this endpoint" },
				{ status: 403 }
			);
		}
		const body = await request.json();
		const { name, feedUrl, description, category, logoUrl, websiteUrl } = body;

		if (!name || !feedUrl) {
			return NextResponse.json(
				{ error: "Name and feed URL are required" },
				{ status: 400 }
			);
		}

		const newSource = await db.insert(rssSources).values({
			name,
			feedUrl,
			description,
			category: category || "general",
			logoUrl,
			websiteUrl,
			isActive: true,
		}).returning();

		return NextResponse.json(newSource[0], { status: 201 });
	} catch (error) {
		console.error("Error creating RSS source:", error);
		return NextResponse.json(
			{ error: "Failed to create RSS source" },
			{ status: 500 }
		);
	}
}