"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArticleContentPanel } from "@/components/articles/article-content-panel";
import { NewsSidebar } from "@/components/articles/news-sidebar";
import { useScreenSize } from "@/hooks/use-screen-size";

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
	// Use window.innerWidth for initial check to handle hydration
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
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
			// On mobile, navigate to individual article page with article data as URL params
			const locale = getCurrentLocale();
			const articleParams = new URLSearchParams({
				title: encodeURIComponent(article.title),
				content: encodeURIComponent(article.content || article.summary || ""),
				source: encodeURIComponent(article.sourcePublisher || "Financial News"),
				category: encodeURIComponent(article.sourceCategory || "general"),
				publishedAt: article.createdAt,
				...(article.summary && { summary: encodeURIComponent(article.summary) })
			});
			const articlePath = `/${locale}/news/view/${article.id}?${articleParams.toString()}`;
			router.push(articlePath);
		} else {
			// On desktop, keep current behavior (show in content panel)
			setSelectedArticle(article);
		}
	};

	const handleToggleCollapse = () => {
		setIsCollapsed(!isCollapsed);
	};

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
