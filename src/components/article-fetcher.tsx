'use client';

import React, { useState } from 'react';
import { useArticleFetching, type FetchedArticle } from '@/lib/hooks/use-article-fetching';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Clock, User, Building, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ArticleFetcherProps {
	initialUrl?: string;
	onArticleFetched?: (article: FetchedArticle) => void;
	showUrlInput?: boolean;
	priority?: number;
	className?: string;
}

export function ArticleFetcher({
	initialUrl = '',
	onArticleFetched,
	showUrlInput = true,
	priority = 1,
	className = ''
}: ArticleFetcherProps) {
	const [url, setUrl] = useState(initialUrl);
	const { fetchArticle, state, clearError, refetch } = useArticleFetching();

	const handleFetch = async () => {
		if (!url.trim()) return;

		try {
			await fetchArticle(url.trim(), priority);
		} catch (error) {
			console.error('Error fetching article:', error);
		}
	};

	const handleArticleComplete = (article: FetchedArticle) => {
		if (onArticleFetched) {
			onArticleFetched(article);
		}
	};

	// Call callback when article is completed
	React.useEffect(() => {
		if (state.article?.status === 'completed') {
			handleArticleComplete(state.article);
		}
	}, [state.article?.status]);

	return (
		<div className={`space-y-4 ${className}`}>
			{showUrlInput && (
				<div className="flex gap-2">
					<Input
						type="url"
						placeholder="Enter article URL..."
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !state.isLoading) {
								handleFetch();
							}
						}}
						disabled={state.isLoading}
						className="flex-1"
					/>
					<Button
						onClick={handleFetch}
						disabled={!url.trim() || state.isLoading}
						className="min-w-[100px]"
					>
						{state.isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{state.isPolling ? 'Processing...' : 'Fetching...'}
							</>
						) : (
							'Fetch Article'
						)}
					</Button>
				</div>
			)}

			{state.error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription className="flex items-center justify-between">
						{state.error}
						<Button
							variant="ghost"
							size="sm"
							onClick={clearError}
							className="ml-2"
						>
							Dismiss
						</Button>
					</AlertDescription>
				</Alert>
			)}

			{state.article && <ArticleDisplay article={state.article} onRefetch={refetch} />}
		</div>
	);
}

interface ArticleDisplayProps {
	article: FetchedArticle;
	onRefetch?: () => void;
}

function ArticleDisplay({ article, onRefetch }: ArticleDisplayProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-800 border-green-300';
			case 'processing':
				return 'bg-blue-100 text-blue-800 border-blue-300';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 border-yellow-300';
			case 'failed':
				return 'bg-red-100 text-red-800 border-red-300';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-300';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="h-4 w-4" />;
			case 'processing':
				return <Loader2 className="h-4 w-4 animate-spin" />;
			case 'pending':
				return <Clock className="h-4 w-4" />;
			case 'failed':
				return <AlertCircle className="h-4 w-4" />;
			default:
				return null;
		}
	};

	const formatReadingTime = (minutes?: number) => {
		if (!minutes) return 'Unknown';
		if (minutes < 1) return '< 1 min';
		return `${minutes} min`;
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return 'Unknown';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<CardTitle className="text-lg font-semibold line-clamp-2">
							{article.title || 'Untitled Article'}
						</CardTitle>
						{article.description && (
							<CardDescription className="mt-2 line-clamp-3">
								{article.description}
							</CardDescription>
						)}
					</div>
					<div className="flex flex-col items-end gap-2">
						<Badge className={getStatusColor(article.status)}>
							{getStatusIcon(article.status)}
							<span className="ml-1 capitalize">{article.status}</span>
						</Badge>
						{article.cached && (
							<Badge variant="outline" className="text-xs">
								Cached
							</Badge>
						)}
					</div>
				</div>

				{(article.author || article.publisher || article.publishedAt) && (
					<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
						{article.author && (
							<div className="flex items-center gap-1">
								<User className="h-3 w-3" />
								{article.author}
							</div>
						)}
						{article.publisher && (
							<div className="flex items-center gap-1">
								<Building className="h-3 w-3" />
								{article.publisher}
							</div>
						)}
						{article.publishedAt && (
							<div className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								{formatDate(article.publishedAt)}
							</div>
						)}
					</div>
				)}

				{article.url && (
					<div className="flex items-center gap-2">
						<a
							href={article.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
						>
							<ExternalLink className="h-3 w-3 flex-shrink-0" />
							<span className="truncate">{article.url}</span>
						</a>
					</div>
				)}
			</CardHeader>

			<CardContent>
				{article.status === 'failed' && article.errorMessage && (
					<Alert variant="destructive" className="mb-4">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							{article.errorMessage}
							{onRefetch && (
								<Button
									variant="ghost"
									size="sm"
									onClick={onRefetch}
									className="ml-2"
								>
									Retry
								</Button>
							)}
						</AlertDescription>
					</Alert>
				)}

				{article.status === 'processing' && (
					<div className="flex items-center justify-center py-8 text-muted-foreground">
						<Loader2 className="mr-2 h-5 w-5 animate-spin" />
						<span>
							Processing article...
							{article.processingTimeMs && (
								<span className="ml-1">
									({Math.round(article.processingTimeMs / 1000)}s)
								</span>
							)}
						</span>
					</div>
				)}

				{article.status === 'pending' && (
					<div className="flex items-center justify-center py-8 text-muted-foreground">
						<Clock className="mr-2 h-5 w-5" />
						<span>Article queued for processing...</span>
					</div>
				)}

				{article.status === 'completed' && (
					<div className="space-y-4">
						{/* Article Stats */}
						<div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-b pb-4">
							{article.wordCount && (
								<span>{article.wordCount.toLocaleString()} words</span>
							)}
							{article.readingTimeMinutes && (
								<span>{formatReadingTime(article.readingTimeMinutes)} read</span>
							)}
							{article.viewCount && (
								<div className="flex items-center gap-1">
									<Eye className="h-3 w-3" />
									{article.viewCount} views
								</div>
							)}
						</div>

						{/* Featured Image */}
						{article.featuredImage && (
							<div className="aspect-video w-full overflow-hidden rounded-lg">
								<img
									src={article.featuredImage}
									alt={article.title || 'Article image'}
									className="h-full w-full object-cover"
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = 'none';
									}}
								/>
							</div>
						)}

						{/* Article Content */}
						{article.content && (
							<div
								className="prose prose-sm max-w-none"
								dangerouslySetInnerHTML={{ __html: article.content }}
							/>
						)}

						{/* Fallback to text content if HTML content is not available */}
						{!article.content && article.textContent && (
							<div className="prose prose-sm max-w-none whitespace-pre-wrap">
								{article.textContent}
							</div>
						)}

						{/* Additional Images */}
						{article.images && article.images.length > 1 && (
							<div className="space-y-2">
								<h4 className="text-sm font-medium">Additional Images</h4>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
									{article.images
										.filter(img => img !== article.featuredImage)
										.slice(0, 6)
										.map((img, index) => (
											<img
												key={index}
												src={img}
												alt={`Article image ${index + 1}`}
												className="aspect-video w-full object-cover rounded"
												onError={(e) => {
													(e.target as HTMLImageElement).style.display = 'none';
												}}
											/>
										))}
								</div>
							</div>
						)}

						{/* Keywords/Topics */}
						{(article.keywords || article.topics) && (
							<div className="space-y-2">
								<h4 className="text-sm font-medium">Topics</h4>
								<div className="flex flex-wrap gap-1">
									{article.keywords?.slice(0, 10).map((keyword, index) => (
										<Badge key={index} variant="secondary" className="text-xs">
											{keyword}
										</Badge>
									))}
									{article.topics?.slice(0, 5).map((topic, index) => (
										<Badge key={`topic-${index}`} variant="outline" className="text-xs">
											{topic}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default ArticleFetcher;