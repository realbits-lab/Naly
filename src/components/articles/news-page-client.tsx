"use client";

import { useState } from "react";
import { ArticleContentPanel } from "@/components/articles/article-content-panel";
import { NewsSidebar } from "@/components/articles/news-sidebar";

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

	const handleArticleSelect = (article: Article) => {
		setSelectedArticle(article);
	};

	const handleToggleCollapse = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 relative">
			{/* Sidebar - Fixed width to prevent shifting */}
			<div className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
				<NewsSidebar
					selectedArticleId={selectedArticle?.id || null}
					onArticleSelect={handleArticleSelect}
					isCollapsed={isCollapsed}
					onToggleCollapse={handleToggleCollapse}
				/>
			</div>

			{/* Main Content Area - Fixed flex-grow to prevent shifting */}
			<div className="flex-1 min-w-0">
				<ArticleContentPanel article={selectedArticle} />
			</div>
		</div>
	);
}
