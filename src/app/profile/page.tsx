import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Profile - Naly",
	description: "Manage your profile and account settings",
};

export default function ProfilePage() {
	return (
		<div className="container mx-auto py-8">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Profile</h1>
					<p className="text-muted-foreground">
						Manage your account settings and preferences
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<div className="rounded-lg border p-6">
						<h2 className="text-xl font-semibold mb-4">Account Information</h2>
						<div className="space-y-4">
							<div>
								<label className="text-sm font-medium">Name</label>
								<p className="text-muted-foreground">Your display name</p>
							</div>
							<div>
								<label className="text-sm font-medium">Email</label>
								<p className="text-muted-foreground">Your email address</p>
							</div>
							<div>
								<label className="text-sm font-medium">Member Since</label>
								<p className="text-muted-foreground">Account creation date</p>
							</div>
						</div>
					</div>

					<div className="rounded-lg border p-6">
						<h2 className="text-xl font-semibold mb-4">Preferences</h2>
						<div className="space-y-4">
							<div>
								<label className="text-sm font-medium">Notifications</label>
								<p className="text-muted-foreground">
									Email and push notifications
								</p>
							</div>
							<div>
								<label className="text-sm font-medium">Theme</label>
								<p className="text-muted-foreground">Light or dark mode</p>
							</div>
							<div>
								<label className="text-sm font-medium">Language</label>
								<p className="text-muted-foreground">Interface language</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
