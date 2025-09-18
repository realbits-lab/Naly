"use client";

import { Check, Moon, Monitor, Palette, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

const themes = [
	{
		name: "Light",
		value: "light",
		icon: Sun,
		description: "Clean, bright appearance"
	},
	{
		name: "Dark",
		value: "dark",
		icon: Moon,
		description: "Easy on the eyes in low light"
	},
	{
		name: "System",
		value: "system",
		icon: Monitor,
		description: "Follows your device settings"
	},
	{
		name: "Blue",
		value: "blue",
		icon: Palette,
		description: "Professional blue accent"
	},
	{
		name: "Green",
		value: "green",
		icon: Palette,
		description: "Fresh green accent"
	},
	{
		name: "Purple",
		value: "purple",
		icon: Palette,
		description: "Creative purple accent"
	},
];

export function AppearancePanel() {
	const { theme, setTheme } = useTheme();
	const { settings, updateTheme, isLoaded } = useSettings();

	const handleThemeChange = (newTheme: string) => {
		setTheme(newTheme as any);
		updateTheme(newTheme);
	};

	if (!isLoaded) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse space-y-4">
					<div className="h-6 bg-muted rounded w-1/3"></div>
					<div className="h-4 bg-muted rounded w-2/3"></div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="h-20 bg-muted rounded"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-foreground mb-2">Appearance</h2>
				<p className="text-muted-foreground">
					Customize the visual theme and color scheme of your interface.
				</p>
			</div>

			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold text-foreground mb-3">Theme Selection</h3>
					<p className="text-sm text-muted-foreground mb-4">
						Choose a theme that matches your preference and working environment.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{themes.map((themeOption) => {
						const Icon = themeOption.icon;
						const isSelected = theme === themeOption.value;

						return (
							<button
								key={themeOption.value}
								onClick={() => handleThemeChange(themeOption.value)}
								className={cn(
									"relative flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all",
									"hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
									isSelected
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/30"
								)}
							>
								<div className={cn(
									"flex items-center justify-center w-10 h-10 rounded-lg border",
									isSelected
										? "bg-primary text-primary-foreground border-primary"
										: "bg-muted border-border"
								)}>
									<Icon className="h-5 w-5" />
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<h4 className={cn(
											"font-medium text-sm",
											isSelected ? "text-primary" : "text-foreground"
										)}>
											{themeOption.name}
										</h4>
										{isSelected && (
											<Check className="h-4 w-4 text-primary" />
										)}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{themeOption.description}
									</p>
								</div>

								{isSelected && (
									<div className="absolute top-2 right-2">
										<div className="w-2 h-2 bg-primary rounded-full"></div>
									</div>
								)}
							</button>
						);
					})}
				</div>

				<div className="mt-6 p-4 bg-muted/30 rounded-lg border">
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
							<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
						</div>
						<div>
							<h4 className="text-sm font-medium text-foreground mb-1">Theme Persistence</h4>
							<p className="text-xs text-muted-foreground">
								Your theme preference is automatically saved and will be applied every time you visit this site.
								System theme follows your device's dark/light mode setting.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}