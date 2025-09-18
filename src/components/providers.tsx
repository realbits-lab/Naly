"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { ThemeProvider } from "@/components/theme-provider";

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<AuthSessionProvider>
			<ThemeProvider defaultTheme="light" storageKey="naly-ui-theme">
				{children}
				<Toaster position="top-right" richColors closeButton />
			</ThemeProvider>
		</AuthSessionProvider>
	);
}
