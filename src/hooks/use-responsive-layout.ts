"use client";

import { useState, useEffect, useCallback } from "react";
import { useSettings, type LayoutMode } from "./use-settings";

export function useResponsiveLayout() {
	const { settings, isLoaded } = useSettings();
	const [effectiveLayoutMode, setEffectiveLayoutMode] = useState<"desktop" | "mobile">("desktop");
	const [screenWidth, setScreenWidth] = useState<number>(0);

	// Memoized layout calculation function
	const calculateLayout = useCallback((layoutMode: LayoutMode, currentScreenWidth: number): "desktop" | "mobile" => {
		switch (layoutMode) {
			case "automatic":
				// Responsive breakpoint: 768px (standard md breakpoint)
				return currentScreenWidth >= 768 ? "desktop" : "mobile";
			case "desktop":
				// ALWAYS desktop - user preference overrides screen size
				return "desktop";
			case "mobile":
				// ALWAYS mobile - user preference overrides screen size
				return "mobile";
			default:
				return "desktop";
		}
	}, []);

	// Handle screen size changes (only for automatic mode)
	useEffect(() => {
		if (typeof window === "undefined") return;

		const updateScreenSize = () => {
			const newWidth = window.innerWidth;
			setScreenWidth(newWidth);

			// Only recalculate layout if in automatic mode and settings are loaded
			if (isLoaded && settings.layoutMode === "automatic") {
				const newLayout = calculateLayout(settings.layoutMode, newWidth);
				setEffectiveLayoutMode(newLayout);
			}
		};

		// Initial screen size
		updateScreenSize();

		// Listen to resize events (but only act on them in automatic mode)
		window.addEventListener("resize", updateScreenSize);
		return () => window.removeEventListener("resize", updateScreenSize);
	}, [isLoaded, settings.layoutMode, calculateLayout]);

	// Handle layout mode changes
	useEffect(() => {
		if (!isLoaded) {
			// Before settings load, default to desktop to prevent layout flash
			setEffectiveLayoutMode("desktop");
			return;
		}

		// Immediately update layout when settings change
		const newLayout = calculateLayout(settings.layoutMode, screenWidth || window.innerWidth);
		setEffectiveLayoutMode(newLayout);
	}, [settings.layoutMode, isLoaded, screenWidth, calculateLayout]);

	return {
		// Settings
		layoutMode: settings.layoutMode,
		effectiveLayoutMode,
		isLoaded,

		// Layout state
		isDesktop: effectiveLayoutMode === "desktop",
		isMobile: effectiveLayoutMode === "mobile",

		// Screen info (for debugging/display)
		screenWidth,

		// Helper function for conditional rendering
		showDesktop: effectiveLayoutMode === "desktop",
		showMobile: effectiveLayoutMode === "mobile",

		// Layout class helpers
		desktopClasses: effectiveLayoutMode === "desktop" ? "flex" : "hidden",
		mobileClasses: effectiveLayoutMode === "mobile" ? "flex" : "hidden",
	};
}