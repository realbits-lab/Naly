"use client";

import { Globe, Monitor, Palette, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettingsTab } from "./settings-page-client";

interface SettingsSidebarProps {
	activeTab: SettingsTab;
	onTabChange: (tab: SettingsTab) => void;
}

const sidebarItems = [
	{
		id: "appearance" as const,
		name: "Appearance",
		description: "Customize themes and visual preferences",
		icon: Palette,
	},
	{
		id: "layout" as const,
		name: "Layout",
		description: "Control responsive layout behavior",
		icon: Monitor,
	},
	{
		id: "language" as const,
		name: "Language",
		description: "Choose your preferred language",
		icon: Globe,
	},
];

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2 mb-6 px-3">
				<Settings className="h-5 w-5 text-primary" />
				<h2 className="text-lg font-semibold">Settings</h2>
			</div>

			<nav className="space-y-1">
				{sidebarItems.map((item) => {
					const Icon = item.icon;
					const isActive = activeTab === item.id;

					return (
						<button
							key={item.id}
							onClick={() => onTabChange(item.id)}
							className={cn(
								"w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors",
								"hover:bg-muted/50",
								isActive
									? "bg-primary/10 text-primary border border-primary/20"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							<Icon className={cn(
								"h-5 w-5 mt-0.5 flex-shrink-0",
								isActive ? "text-primary" : "text-muted-foreground"
							)} />
							<div className="min-w-0">
								<div className={cn(
									"font-medium text-sm",
									isActive ? "text-primary" : "text-foreground"
								)}>
									{item.name}
								</div>
								<div className="text-xs text-muted-foreground mt-1 leading-tight">
									{item.description}
								</div>
							</div>
						</button>
					);
				})}
			</nav>
		</div>
	);
}