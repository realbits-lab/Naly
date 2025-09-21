import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShieldOff } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function UnauthorizedPage() {
	const t = useTranslations("Unauthorized");

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
						<ShieldOff className="h-6 w-6 text-red-600 dark:text-red-400" />
					</div>
					<CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
					<CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
						You don't have permission to access this page. Only managers can view the monitors page.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<Link href="/">
						<Button className="w-full">Go to Home</Button>
					</Link>
					<Link href="/dashboard">
						<Button variant="outline" className="w-full">Go to Dashboard</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}