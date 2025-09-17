import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userLanguagePreferences } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { isValidLocale, type Locale } from "@/i18n/config";

const languagePreferenceSchema = z.object({
	languageCode: z.string().refine((code) => isValidLocale(code), {
		message: "Invalid language code",
	}),
	isDefault: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { languageCode, isDefault } = languagePreferenceSchema.parse(body);

		// Start a transaction to ensure consistency
		await db.transaction(async (tx) => {
			// If this is being set as default, first remove default flag from other preferences
			if (isDefault) {
				await tx
					.update(userLanguagePreferences)
					.set({
						isDefault: "false",
						updatedAt: new Date()
					})
					.where(eq(userLanguagePreferences.userId, session.user!.id));
			}

			// Check if preference already exists for this language
			const existingPreference = await tx
				.select()
				.from(userLanguagePreferences)
				.where(
					and(
						eq(userLanguagePreferences.userId, session.user!.id),
						eq(userLanguagePreferences.languageCode, languageCode)
					)
				)
				.limit(1);

			if (existingPreference.length > 0) {
				// Update existing preference
				await tx
					.update(userLanguagePreferences)
					.set({
						isDefault: isDefault ? "true" : "false",
						updatedAt: new Date(),
					})
					.where(eq(userLanguagePreferences.id, existingPreference[0].id));
			} else {
				// Create new preference
				await tx.insert(userLanguagePreferences).values({
					userId: session.user!.id,
					languageCode: languageCode as Locale,
					isDefault: isDefault ? "true" : "false",
				});
			}
		});

		return NextResponse.json({
			success: true,
			message: "Language preference saved successfully",
		});
	} catch (error) {
		console.error("Failed to save language preference:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Invalid input",
					details: error.errors
				},
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to save language preference" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const preferences = await db
			.select()
			.from(userLanguagePreferences)
			.where(eq(userLanguagePreferences.userId, session.user.id))
			.orderBy(userLanguagePreferences.isDefault);

		// Find the default preference
		const defaultPreference = preferences.find(p => p.isDefault === "true");

		return NextResponse.json({
			success: true,
			preferences,
			defaultLanguage: defaultPreference?.languageCode || "en",
		});
	} catch (error) {
		console.error("Failed to fetch language preferences:", error);
		return NextResponse.json(
			{ error: "Failed to fetch language preferences" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const languageCode = searchParams.get("languageCode");

		if (!languageCode || !isValidLocale(languageCode)) {
			return NextResponse.json(
				{ error: "Valid language code is required" },
				{ status: 400 }
			);
		}

		await db
			.delete(userLanguagePreferences)
			.where(
				and(
					eq(userLanguagePreferences.userId, session.user.id),
					eq(userLanguagePreferences.languageCode, languageCode)
				)
			);

		return NextResponse.json({
			success: true,
			message: "Language preference deleted successfully",
		});
	} catch (error) {
		console.error("Failed to delete language preference:", error);
		return NextResponse.json(
			{ error: "Failed to delete language preference" },
			{ status: 500 }
		);
	}
}