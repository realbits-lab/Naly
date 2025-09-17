"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { type Locale, defaultLocale, isValidLocale } from "@/i18n/config";

interface LanguagePreference {
	locale: Locale;
	isDefault: boolean;
	lastUpdated: Date;
}

interface UseLanguagePreferenceReturn {
	currentLocale: Locale;
	setLanguagePreference: (locale: Locale, saveToServer?: boolean) => Promise<void>;
	isLoading: boolean;
	error: string | null;
}

export function useLanguagePreference(): UseLanguagePreferenceReturn {
	const currentLocale = useLocale() as Locale;
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load language preference from localStorage on mount
	useEffect(() => {
		const storedLocale = localStorage.getItem("user-locale");
		if (storedLocale && isValidLocale(storedLocale) && storedLocale !== currentLocale) {
			// If stored locale differs from current, update the URL
			updateLocaleInUrl(storedLocale);
		}
	}, [currentLocale]);

	const updateLocaleInUrl = useCallback((newLocale: Locale) => {
		const currentPath = window.location.pathname;
		let newPath = currentPath;

		// Remove existing locale prefix if present
		const pathSegments = currentPath.split('/').filter(Boolean);
		if (pathSegments.length > 0 && isValidLocale(pathSegments[0])) {
			newPath = '/' + pathSegments.slice(1).join('/');
		}

		// Add new locale prefix if not default
		if (newLocale !== defaultLocale) {
			newPath = `/${newLocale}${newPath}`;
		}

		// Navigate to new path
		router.push(newPath);
		router.refresh();
	}, [router]);

	const setLanguagePreference = useCallback(async (
		locale: Locale,
		saveToServer: boolean = true
	): Promise<void> => {
		if (!isValidLocale(locale)) {
			setError("Invalid locale provided");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Store in localStorage immediately
			localStorage.setItem("user-locale", locale);

			// Store in cookie for server-side access
			const cookieValue = `user-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
			document.cookie = cookieValue;

			// Update URL if needed
			if (locale !== currentLocale) {
				updateLocaleInUrl(locale);
			}

			// Save to server if user is authenticated and saveToServer is true
			if (saveToServer) {
				try {
					const response = await fetch("/api/user/language-preference", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							languageCode: locale,
							isDefault: true,
						}),
					});

					if (!response.ok) {
						console.warn("Failed to save language preference to server");
						// Don't throw error - local storage is sufficient fallback
					}
				} catch (serverError) {
					console.warn("Server request failed:", serverError);
					// Continue with local storage as fallback
				}
			}
		} catch (localError) {
			setError("Failed to update language preference");
			console.error("Language preference update failed:", localError);
		} finally {
			setIsLoading(false);
		}
	}, [currentLocale, updateLocaleInUrl]);

	return {
		currentLocale,
		setLanguagePreference,
		isLoading,
		error,
	};
}

// Utility function to get stored language preference
export function getStoredLanguagePreference(): Locale | null {
	if (typeof window === "undefined") return null;

	const stored = localStorage.getItem("user-locale");
	return stored && isValidLocale(stored) ? stored : null;
}

// Utility function to clear language preference
export function clearLanguagePreference(): void {
	if (typeof window === "undefined") return;

	localStorage.removeItem("user-locale");
	document.cookie = "user-locale=; path=/; max-age=0";
}