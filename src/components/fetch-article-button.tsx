'use client';

import React, { useState } from 'react';
import { useArticleFetching } from '@/lib/hooks/use-article-fetching';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import ArticleFetcher from './article-fetcher';

interface FetchArticleButtonProps {
	url: string;
	title?: string;
	variant?: 'default' | 'secondary' | 'ghost' | 'link' | 'outline';
	size?: 'default' | 'sm' | 'lg' | 'icon';
	showDialog?: boolean;
	priority?: number;
	className?: string;
	children?: React.ReactNode;
}

export function FetchArticleButton({
	url,
	title = 'Fetch Full Article',
	variant = 'outline',
	size = 'sm',
	showDialog = true,
	priority = 1,
	className = '',
	children
}: FetchArticleButtonProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const { fetchArticle, state } = useArticleFetching();

	const handleFetch = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (showDialog) {
			setIsDialogOpen(true);
		} else {
			await fetchArticle(url, priority);
		}
	};

	const getButtonIcon = () => {
		if (state.isLoading) {
			return <Loader2 className="h-4 w-4 animate-spin" />;
		}

		switch (state.article?.status) {
			case 'completed':
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			case 'failed':
				return <AlertCircle className="h-4 w-4 text-red-600" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

	const getButtonText = () => {
		if (state.isLoading) {
			return state.isPolling ? 'Processing...' : 'Fetching...';
		}

		switch (state.article?.status) {
			case 'completed':
				return 'Article Ready';
			case 'processing':
				return 'Processing...';
			case 'pending':
				return 'In Queue...';
			case 'failed':
				return 'Failed - Retry';
			default:
				return title;
		}
	};

	const isDisabled = state.isLoading && state.article?.status !== 'failed';

	if (showDialog) {
		return (
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogTrigger asChild>
					<Button
						variant={variant}
						size={size}
						onClick={handleFetch}
						disabled={isDisabled}
						className={`gap-2 ${className}`}
					>
						{children || (
							<>
								{getButtonIcon()}
								{size !== 'icon' && getButtonText()}
							</>
						)}
					</Button>
				</DialogTrigger>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Article Viewer
						</DialogTitle>
						<DialogDescription className="flex items-center gap-2 text-sm">
							<ExternalLink className="h-3 w-3" />
							<a
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:underline truncate"
							>
								{url}
							</a>
						</DialogDescription>
					</DialogHeader>
					<ArticleFetcher
						initialUrl={url}
						showUrlInput={false}
						priority={priority}
						onArticleFetched={() => {
							// Article fetched successfully
							console.log('Article fetched successfully');
						}}
					/>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleFetch}
			disabled={isDisabled}
			className={`gap-2 ${className}`}
		>
			{children || (
				<>
					{getButtonIcon()}
					{size !== 'icon' && getButtonText()}
				</>
			)}
		</Button>
	);
}

export default FetchArticleButton;