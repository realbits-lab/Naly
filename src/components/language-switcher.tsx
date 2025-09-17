"use client";

import { Check, Globe, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { type Locale, locales, localeLabels } from "@/i18n/config";

interface LanguageSwitcherProps {
	variant?: "button" | "compact";
	showLabel?: boolean;
}

export function LanguageSwitcher({
	variant = "button",
	showLabel = true,
}: LanguageSwitcherProps) {
	const t = useTranslations("language");
	const currentLocale = useLocale() as Locale;
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();
	const [isOpen, setIsOpen] = useState(false);

	const switchLanguage = (newLocale: Locale) => {
		startTransition(() => {
			// Store preference in localStorage
			localStorage.setItem("user-locale", newLocale);

			// Store preference in cookie for server-side access
			document.cookie = `user-locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

			// Update URL with new locale
			let newPathname = pathname;

			// Remove current locale from pathname if it exists
			const currentLocaleInPath = locales.find((locale) =>
				pathname.startsWith(`/${locale}`),
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
			toast.success(t("languageChanged"));

			setIsOpen(false);
		});
	};

	const TriggerButton = () => {
		if (variant === "compact") {
			return (
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 p-0"
					disabled={isPending}
				>
					<Globe className="h-4 w-4" />
					<span className="sr-only">{t("switchLanguage")}</span>
				</Button>
			);
		}

		return (
			<Button
				variant="outline"
				size="sm"
				className="flex items-center gap-2"
				disabled={isPending}
			>
				<Languages className="h-4 w-4" />
				{showLabel && (
					<span className="hidden sm:inline">
						{localeLabels[currentLocale].nativeName}
					</span>
				)}
			</Button>
		);
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<TriggerButton />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuLabel className="flex items-center gap-2">
					<Globe className="h-4 w-4" />
					{t("selectLanguage")}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{locales.map((locale) => (
					<DropdownMenuItem
						key={locale}
						onClick={() => switchLanguage(locale)}
						className="flex items-center justify-between cursor-pointer"
						disabled={isPending}
					>
						<div className="flex flex-col">
							<span className="font-medium">
								{localeLabels[locale].nativeName}
							</span>
							<span className="text-xs text-muted-foreground">
								{localeLabels[locale].name}
							</span>
						</div>
						{currentLocale === locale && (
							<Check className="h-4 w-4 text-primary" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// Simplified version for use in navigation
export function LanguageSwitcherCompact() {
	return <LanguageSwitcher variant="compact" showLabel={false} />;
}

// Full version with label for settings pages
export function LanguageSwitcherFull() {
	return <LanguageSwitcher variant="button" showLabel={true} />;
}