"use client";

import { useState, useEffect } from "react";
import { useSettings, type LayoutMode } from "./use-settings";

export function useResponsiveLayout() {
	const { settings, isLoaded } = useSettings();
	const [effectiveLayoutMode, setEffectiveLayoutMode] = useState<"desktop" | "mobile">("desktop");

	useEffect(() => {
		if (!isLoaded) return;

		const updateLayout = () => {
			const screenWidth = window.innerWidth;

			switch (settings.layoutMode) {
				case "automatic":
					// Use standard responsive breakpoint (768px for tablet/mobile)
					setEffectiveLayoutMode(screenWidth >= 768 ? "desktop" : "mobile");
					break;
				case "desktop":
					// Always use desktop layout regardless of screen size
					setEffectiveLayoutMode("desktop");
					break;
				case "mobile":
					// Always use mobile layout regardless of screen size
					setEffectiveLayoutMode("mobile");
					break;
				default:
					setEffectiveLayoutMode("desktop");
			}
		};

		// Initial layout calculation
		updateLayout();

		// Only listen to resize events if mode is "automatic"
		if (settings.layoutMode === "automatic") {
			window.addEventListener("resize", updateLayout);
			return () => window.removeEventListener("resize", updateLayout);
		}
	}, [settings.layoutMode, isLoaded]);

	return {
		layoutMode: settings.layoutMode,
		effectiveLayoutMode,
		isLoaded,
		isDesktop: effectiveLayoutMode === "desktop",
		isMobile: effectiveLayoutMode === "mobile",
	};
}