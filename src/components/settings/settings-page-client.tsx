"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SettingsSidebar } from "./settings-sidebar";
import { AppearancePanel } from "./appearance-panel";
import { LayoutPanel } from "./layout-panel";

export type SettingsTab = "appearance" | "layout";

export function SettingsPageClient() {
	const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

	const renderContent = () => {
		switch (activeTab) {
			case "appearance":
				return <AppearancePanel />;
			case "layout":
				return <LayoutPanel />;
			default:
				return <AppearancePanel />;
		}
	};

	return (
		<div className="flex gap-8">
			{/* Left Sidebar */}
			<div className="w-64 flex-shrink-0">
				<SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
			</div>

			{/* Right Content Panel */}
			<div className="flex-1 min-w-0">
				<div className="bg-card rounded-lg border p-6">
					{renderContent()}
				</div>
			</div>
		</div>
	);
}