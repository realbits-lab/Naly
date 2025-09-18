"use client";

import { useState, useEffect } from "react";

export type LayoutMode = "automatic" | "desktop" | "mobile";

interface UserSettings {
	theme: string;
	layoutMode: LayoutMode;
}

const defaultSettings: UserSettings = {
	theme: "system",
	layoutMode: "automatic",
};

const SETTINGS_STORAGE_KEY = "naly-user-settings";

export function useSettings() {
	const [settings, setSettings] = useState<UserSettings>(defaultSettings);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load settings from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
			if (stored) {
				const parsedSettings = JSON.parse(stored);
				setSettings({ ...defaultSettings, ...parsedSettings });
			}
		} catch (error) {
			console.warn("Failed to load user settings from localStorage:", error);
		} finally {
			setIsLoaded(true);
		}
	}, []);

	// Save settings to localStorage whenever they change
	const updateSettings = (newSettings: Partial<UserSettings>) => {
		const updatedSettings = { ...settings, ...newSettings };
		setSettings(updatedSettings);

		try {
			localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
		} catch (error) {
			console.warn("Failed to save user settings to localStorage:", error);
		}
	};

	const updateTheme = (theme: string) => {
		updateSettings({ theme });
	};

	const updateLayoutMode = (layoutMode: LayoutMode) => {
		updateSettings({ layoutMode });
	};

	return {
		settings,
		isLoaded,
		updateSettings,
		updateTheme,
		updateLayoutMode,
	};
}