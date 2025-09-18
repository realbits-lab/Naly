"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LanguagePanel() {
	const pathname = usePathname();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	// Get current locale from pathname
	const getCurrentLocale = (): Locale => {
		const localeInPath = locales.find((locale) =>
			pathname.startsWith(`/${locale}`)
		);
		return localeInPath || "en";
	};

	const currentLocale = getCurrentLocale();

	const switchLanguage = (newLocale: Locale) => {
		if (newLocale === currentLocale) return;

		startTransition(() => {
			// Store preference in localStorage
			localStorage.setItem("user-locale", newLocale);

			// Store preference in cookie for server-side access
			document.cookie = `user-locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

			// Update URL with new locale
			let newPathname = pathname;

			// Remove current locale from pathname if it exists
			const currentLocaleInPath = locales.find((locale) =>
				pathname.startsWith(`/${locale}`)
			);
			if (currentLocaleInPath) {
				newPathname = pathname.slice(`/${currentLocaleInPath}`.length) || "/";
			}

			// Add new locale prefix if it's not the default locale
			if (newLocale !== "en") {
				newPathname = `/${newLocale}${newPathname}`;
			}

			// Navigate to new URL
			router.push(newPathname);
			router.refresh();

			// Show success message
			toast.success("Language changed successfully!");
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold">Language Preferences</h2>
				<p className="text-muted-foreground mt-1">
					Choose your preferred language for the interface
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Globe className="h-5 w-5" />
						Interface Language
					</CardTitle>
					<CardDescription>
						Select the language you want to use for the user interface.
						This will change all menus, buttons, and interface text.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{locales.map((locale) => (
						<Button
							key={locale}
							variant={currentLocale === locale ? "default" : "outline"}
							className={cn(
								"w-full justify-between text-left h-auto p-4",
								currentLocale === locale && "ring-2 ring-primary ring-offset-2"
							)}
							onClick={() => switchLanguage(locale)}
							disabled={isPending}
						>
							<div className="flex flex-col items-start">
								<span className="font-medium text-base">
									{localeLabels[locale].nativeName}
								</span>
								<span className="text-sm text-muted-foreground">
									{localeLabels[locale].name}
								</span>
							</div>
							{currentLocale === locale && (
								<Check className="h-5 w-5 text-primary" />
							)}
						</Button>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Language Information</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm text-muted-foreground">
					<p>
						• Language preferences are saved automatically and will persist across sessions
					</p>
					<p>
						• Content language may vary depending on availability of translations
					</p>
					<p>
						• Some third-party content (like RSS feeds) may appear in their original language
					</p>
				</CardContent>
			</Card>
		</div>
	);
}