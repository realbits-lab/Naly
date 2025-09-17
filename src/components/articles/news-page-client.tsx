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
		<div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4">
			{/* Sidebar */}
			<NewsSidebar
				selectedArticleId={selectedArticle?.id || null}
				onArticleSelect={handleArticleSelect}
				isCollapsed={isCollapsed}
				onToggleCollapse={handleToggleCollapse}
			/>

			{/* Main Content Area */}
			<ArticleContentPanel article={selectedArticle} />
		</div>
	);
}
