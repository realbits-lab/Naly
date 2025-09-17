import { notFound } from "next/navigation";
import { Navigation } from "@/components/layout/navigation";

interface LocaleLayoutProps {
	children: React.ReactNode;
	params: { locale: string };
}

const locales = ["en", "ko"];

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
	// Validate that the incoming `locale` parameter is valid
	if (!locales.includes(params.locale as any)) notFound();

	return (
		<div className="min-h-screen bg-background font-sans antialiased">
			<Navigation />
			<main className="relative flex min-h-screen flex-col">
				{children}
			</main>
		</div>
	);
}