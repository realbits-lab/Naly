import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { RegisterServiceWorker } from "./register-sw";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Naly - AI-Powered Financial Intelligence",
	description:
		"Transform complex market data into clear, actionable insights and probabilistic forecasts.",
	keywords:
		"financial intelligence, market analysis, AI predictions, stock analysis, investment insights",
	authors: [{ name: "Naly Team" }],
	creator: "Naly",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://naly.ai",
		title: "Naly - AI-Powered Financial Intelligence",
		description:
			"Transform complex market data into clear, actionable insights and probabilistic forecasts.",
		siteName: "Naly",
	},
	twitter: {
		card: "summary_large_image",
		title: "Naly - AI-Powered Financial Intelligence",
		description:
			"Transform complex market data into clear, actionable insights and probabilistic forecasts.",
		creator: "@naly_ai",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<Providers>
					{children}
					<RegisterServiceWorker />
				</Providers>
			</body>
		</html>
	);
}
