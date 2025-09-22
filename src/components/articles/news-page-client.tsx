"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { ArticleContentPanel } from "@/components/articles/article-content-panel";
import { useScreenSize } from "@/hooks/use-screen-size";

// Dynamically import the NewsSidebar to avoid SSR hydration issues
const NewsSidebar = dynamic(
	() => import("@/components/articles/news-sidebar-cached").then(mod => ({ default: mod.NewsSidebarCached })),
	{
		ssr: false,
		loading: () => (
			<div className="flex flex-col bg-card md:border-r border-border h-full w-full">
				<div className="flex items-center justify-between p-4 border-b border-border">
					<div className="flex items-center space-x-2">
						<div className="h-5 w-5 bg-muted rounded animate-pulse" />
						<div className="h-6 w-12 bg-muted rounded animate-pulse" />
						<div className="h-5 w-8 bg-muted rounded animate-pulse" />
					</div>
				</div>
				<div className="p-4 space-y-3">
					<div className="h-10 bg-muted rounded animate-pulse" />
					<div className="h-8 bg-muted rounded animate-pulse" />
				</div>
				<div className="flex-1 p-2 space-y-2">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="h-20 bg-muted rounded animate-pulse" />
					))}
				</div>
			</div>
		)
	}
);

interface Article {
	id: string;
	title: string;
	summary?: string;
	content?: string;
	createdAt: string;
	sourcePublisher?: string;
	sourceCategory?: string;
	sentiment?: string;
	readingTime?: number;
}

export function NewsPageClient() {
	const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const screenSize = useScreenSize();

	// Check if we're on mobile (below md breakpoint - 900px)
	// Use mounted state to prevent hydration mismatches
	const [isMobile, setIsMobile] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);

		const checkMobile = () => {
			setIsMobile(window.innerWidth < 900);
		};

		// Initial check
		checkMobile();

		// Update on resize
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Extract current locale from pathname
	const getCurrentLocale = () => {
		const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
		return localeMatch ? localeMatch[1] : 'en';
	};

	const handleArticleSelect = (article: Article) => {
		if (isMobile) {
			// On mobile, navigate to individual article page with just the ID
			const locale = getCurrentLocale();
			const articlePath = `/${locale}/news/view/${article.id}`;
			router.push(articlePath);
		} else {
			// On desktop, keep current behavior (show in content panel)
			setSelectedArticle(article);
		}
	};

	const handleToggleCollapse = () => {
		setIsCollapsed(!isCollapsed);
	};

	// Prevent hydration mismatch by ensuring consistent rendering
	if (!mounted) {
		// During SSR and initial render, always show desktop layout
		return (
			<div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 relative">
				{/* Sidebar - Fixed width to prevent shifting */}
				<div className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
					<NewsSidebar
						selectedArticleId={selectedArticle?.id || null}
						onArticleSelect={handleArticleSelect}
						isCollapsed={isCollapsed}
						onToggleCollapse={handleToggleCollapse}
						autoSelectFirst={true} // Auto-select first article on desktop
					/>
				</div>

				{/* Main Content Area - Fixed flex-grow to prevent shifting */}
				<div className="flex-1 min-w-0">
					<ArticleContentPanel article={selectedArticle} />
				</div>
			</div>
		);
	}

	if (isMobile) {
		// Mobile layout: Show only article list (sidebar content)
		return (
			<div className="h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4">
				<div className="h-full">
					<NewsSidebar
						selectedArticleId={null} // No selection needed on mobile
						onArticleSelect={handleArticleSelect}
						isCollapsed={false} // Always expanded on mobile
						onToggleCollapse={() => {}} // No collapse functionality on mobile
						autoSelectFirst={false} // Don't auto-select on mobile
					/>
				</div>
			</div>
		);
	}

	// Desktop layout: Show both sidebar and content panel
	return (
		<div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 relative">
			{/* Sidebar - Fixed width to prevent shifting */}
			<div className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
				<NewsSidebar
					selectedArticleId={selectedArticle?.id || null}
					onArticleSelect={handleArticleSelect}
					isCollapsed={isCollapsed}
					onToggleCollapse={handleToggleCollapse}
					autoSelectFirst={true} // Auto-select first article on desktop
				/>
			</div>

			{/* Main Content Area - Fixed flex-grow to prevent shifting */}
			<div className="flex-1 min-w-0">
				<ArticleContentPanel article={selectedArticle} />
			</div>
		</div>
	);
}
