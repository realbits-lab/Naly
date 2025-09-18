import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsPageClient } from "@/components/settings/settings-page-client";

export default async function SettingsPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/api/auth/signin");
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground">Settings</h1>
					<p className="text-muted-foreground mt-2">
						Customize your experience and preferences
					</p>
				</div>

				<SettingsPageClient />
			</div>
		</div>
	);
}