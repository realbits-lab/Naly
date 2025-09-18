"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RssSidebar } from "@/components/monitor/rss-sidebar";
import { EnhancedRssContentPanel } from "@/components/monitor/enhanced-rss-content-panel";
import { useScreenSize } from "@/hooks/use-screen-size";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export interface RssSource {
	id: string;
	name: string;
	feedUrl: string;
	description?: string;
	logoUrl?: string;
	category: string;
	isActive: boolean;
}

export interface RssArticle {
	id: string;
	title: string;
	description?: string;
	content?: string;
	link: string;
	publishedAt?: string;
	author?: string;
	sourceId: string;
	sourceName?: string;
	categories?: string[];
}

export function MonitorPageClient() {
	const [selectedSource, setSelectedSource] = useState<RssSource | null>(null);
	const [selectedArticle, setSelectedArticle] = useState<RssArticle | null>(null);
	const [articles, setArticles] = useState<RssArticle[]>([]);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const screenSize = useScreenSize();
	const { isMobile } = useResponsiveLayout();

	// Extract current locale from pathname
	const getCurrentLocale = () => {
		const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
		return localeMatch ? localeMatch[1] : 'en';
	};

	const handleSourceSelect = async (source: RssSource) => {
		setSelectedSource(source);
		setSelectedArticle(null); // Clear selected article when changing source
		setLoading(true);

		try {
			// Fetch RSS articles for the selected source
			const response = await fetch(`/api/monitor/rss?sourceId=${source.id}`);
			if (response.ok) {
				const fetchedArticles = await response.json();
				setArticles(fetchedArticles);

				// Auto-select first article on desktop
				if (!isMobile && fetchedArticles.length > 0) {
					setSelectedArticle(fetchedArticles[0]);
				}
			} else {
				console.error('Failed to fetch RSS articles');
				setArticles([]);
			}
		} catch (error) {
			console.error('Error fetching RSS articles:', error);
			setArticles([]);
		} finally {
			setLoading(false);
		}
	};

	const handleArticleSelect = (article: RssArticle) => {
		if (isMobile) {
			// On mobile, navigate to individual article page
			const locale = getCurrentLocale();
			const articleParams = new URLSearchParams({
				title: encodeURIComponent(article.title),
				content: encodeURIComponent(article.content || article.description || ""),
				link: encodeURIComponent(article.link),
				source: encodeURIComponent(article.sourceName || "RSS Feed"),
				publishedAt: article.publishedAt || new Date().toISOString(),
				...(article.description && { summary: encodeURIComponent(article.description) })
			});
			const articlePath = `/${locale}/monitor/view/${article.id}?${articleParams.toString()}`;
			router.push(articlePath);
		} else {
			// On desktop, show in content panel
			setSelectedArticle(article);
		}
	};

	const handleToggleCollapse = () => {
		setIsCollapsed(!isCollapsed);
	};

	if (isMobile) {
		// Mobile layout: Show sidebar or content panel
		if (selectedSource && !selectedArticle) {
			// Show articles list
			return (
				<div className="w-full h-[calc(100vh-4rem)]">
					<EnhancedRssContentPanel
						source={selectedSource}
						articles={articles}
						selectedArticle={null}
						onArticleSelect={handleArticleSelect}
						onBack={() => setSelectedSource(null)}
						loading={loading}
						isMobile={true}
					/>
				</div>
			);
		} else {
			// Show RSS sources list
			return (
				<div className="w-full h-[calc(100vh-4rem)]">
					<RssSidebar
						selectedSourceId={null}
						onSourceSelect={handleSourceSelect}
						isCollapsed={false}
						onToggleCollapse={() => {}}
						isMobile={true}
					/>
				</div>
			);
		}
	}

	// Desktop layout: Show both sidebar and content panel
	return (
		<div className="w-full h-[calc(100vh-4rem)] flex relative">
				{/* Sidebar - Fixed width to prevent shifting */}
				<div className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
					<RssSidebar
						selectedSourceId={selectedSource?.id || null}
						onSourceSelect={handleSourceSelect}
						isCollapsed={isCollapsed}
						onToggleCollapse={handleToggleCollapse}
						isMobile={false}
					/>
				</div>

				{/* Main Content Area - Fixed flex-grow to prevent shifting */}
				<div className="flex-1 min-w-0">
					<EnhancedRssContentPanel
						source={selectedSource}
						articles={articles}
						selectedArticle={selectedArticle}
						onArticleSelect={handleArticleSelect}
						loading={loading}
						isMobile={false}
					/>
				</div>
		</div>
	);
}