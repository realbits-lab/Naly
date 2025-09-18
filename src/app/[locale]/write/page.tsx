import { Shield } from "lucide-react";
import { redirect } from "next/navigation";
import { WritePageClient } from "@/components/articles/write-page-client";
import { auth } from "@/lib/auth";

export default async function WritePage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/api/auth/signin");
	}

	if (session.user.role !== "admin" && session.user.role !== "manager" && session.user.role !== "writer") {
		redirect("/news");
	}

	return (
		<div className="h-screen flex flex-col max-w-7xl mx-auto px-4">
			<div className="flex items-center space-x-2 p-4 border-b border-border bg-background">
				<Shield className="h-6 w-6 text-primary" />
				<h1 className="text-2xl font-bold">Article Writing Studio</h1>
				<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
					{session.user.role?.toUpperCase()}
				</span>
			</div>

			<WritePageClient />
		</div>
	);
}
