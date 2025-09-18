"use client";

import { Check, Monitor, Smartphone, Zap } from "lucide-react";
import { useSettings, type LayoutMode } from "@/hooks/use-settings";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { cn } from "@/lib/utils";

const layoutModes: Array<{
	value: LayoutMode;
	name: string;
	icon: typeof Monitor;
	description: string;
	details: string;
}> = [
	{
		value: "automatic",
		name: "Automatic",
		icon: Zap,
		description: "Adapts to your screen size",
		details: "Desktop layout on tablets and larger screens, mobile layout on phones"
	},
	{
		value: "desktop",
		name: "Desktop",
		icon: Monitor,
		description: "Always use desktop layout",
		details: "Full navigation and content layout regardless of screen size"
	},
	{
		value: "mobile",
		name: "Mobile",
		icon: Smartphone,
		description: "Always use mobile layout",
		details: "Compact navigation and touch-friendly interface on all devices"
	},
];

export function LayoutPanel() {
	const { settings, updateLayoutMode, isLoaded } = useSettings();
	const { effectiveLayoutMode } = useResponsiveLayout();

	const handleLayoutChange = (newLayoutMode: LayoutMode) => {
		updateLayoutMode(newLayoutMode);
	};

	if (!isLoaded) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse space-y-4">
					<div className="h-6 bg-muted rounded w-1/3"></div>
					<div className="h-4 bg-muted rounded w-2/3"></div>
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
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
				<h2 className="text-2xl font-bold text-foreground mb-2">Layout</h2>
				<p className="text-muted-foreground">
					Control how the interface adapts to different screen sizes and devices.
				</p>
			</div>

			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold text-foreground mb-3">Layout Mode</h3>
					<p className="text-sm text-muted-foreground mb-4">
						Choose how the interface should behave across different screen sizes.
					</p>
				</div>

				<div className="space-y-3">
					{layoutModes.map((mode) => {
						const Icon = mode.icon;
						const isSelected = settings.layoutMode === mode.value;

						return (
							<button
								key={mode.value}
								onClick={() => handleLayoutChange(mode.value)}
								className={cn(
									"w-full flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all",
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
											{mode.name}
										</h4>
										{isSelected && (
											<Check className="h-4 w-4 text-primary" />
										)}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{mode.description}
									</p>
									<p className="text-xs text-muted-foreground/80 mt-1">
										{mode.details}
									</p>
								</div>

								{isSelected && (
									<div className="flex flex-col items-end gap-1">
										<div className="w-2 h-2 bg-primary rounded-full"></div>
									</div>
								)}
							</button>
						);
					})}
				</div>

				{/* Current Layout Status */}
				<div className="mt-6 p-4 bg-muted/30 rounded-lg border">
					<div className="flex items-start gap-3">
						<div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
						</div>
						<div>
							<h4 className="text-sm font-medium text-foreground mb-1">Current Layout Status</h4>
							<p className="text-xs text-muted-foreground">
								Currently using: <span className="font-medium capitalize">{effectiveLayoutMode}</span> layout
								{settings.layoutMode === "automatic" && (
									<span className="text-muted-foreground/80"> (automatically determined)</span>
								)}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Your layout preference is saved and will be applied every time you visit this site.
							</p>
						</div>
					</div>
				</div>

				{/* Layout Mode Explanations */}
				<div className="mt-6 space-y-3">
					<h4 className="text-sm font-semibold text-foreground">Layout Mode Details</h4>
					<div className="grid gap-3">
						<div className="flex gap-3 p-3 bg-muted/20 rounded-lg">
							<Zap className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
							<div>
								<h5 className="text-xs font-medium text-foreground">Automatic Mode</h5>
								<p className="text-xs text-muted-foreground">
									Responsive breakpoint at 768px. Desktop for tablets and up, mobile for phones.
								</p>
							</div>
						</div>
						<div className="flex gap-3 p-3 bg-muted/20 rounded-lg">
							<Monitor className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
							<div>
								<h5 className="text-xs font-medium text-foreground">Desktop Mode</h5>
								<p className="text-xs text-muted-foreground">
									Full sidebar navigation, expanded content panels, and desktop-optimized layouts.
								</p>
							</div>
						</div>
						<div className="flex gap-3 p-3 bg-muted/20 rounded-lg">
							<Smartphone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
							<div>
								<h5 className="text-xs font-medium text-foreground">Mobile Mode</h5>
								<p className="text-xs text-muted-foreground">
									Compact navigation, touch-friendly buttons, and single-column layouts.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}