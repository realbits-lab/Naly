import { MonitorPanel } from "@/components/articles/panels/monitor-panel";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/types/user";

export default async function MonitorPageRoute() {
	const session = await auth();

	// Check if user is authenticated
	if (!session?.user) {
		redirect("/auth/signin");
	}

	// Check if user has manager role
	if (session.user.role !== UserRole.MANAGER) {
		redirect("/unauthorized");
	}

	return <MonitorPanel />;
}