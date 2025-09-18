import { useState, useEffect, useCallback, useRef } from 'react';

export interface FetchedArticle {
	id: string;
	url: string;
	title?: string;
	description?: string;
	content?: string;
	textContent?: string;
	wordCount?: number;
	readingTimeMinutes?: number;
	author?: string;
	publisher?: string;
	publishedAt?: string;
	featuredImage?: string;
	images?: string[];
	meta?: Record<string, any>;
	summary?: string;
	keywords?: string[];
	entities?: any[];
	sentiment?: string;
	topics?: string[];
	viewCount?: number;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	fetchStartedAt?: string;
	fetchCompletedAt?: string;
	processingTimeMs?: number;
	errorMessage?: string;
	retryCount?: number;
	cached?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface ArticleFetchState {
	article: FetchedArticle | null;
	isLoading: boolean;
	error: string | null;
	isPolling: boolean;
}

export interface UseArticleFetchingReturn {
	fetchArticle: (url: string, priority?: number) => Promise<void>;
	state: ArticleFetchState;
	clearError: () => void;
	refetch: () => Promise<void>;
}

export function useArticleFetching(): UseArticleFetchingReturn {
	const [state, setState] = useState<ArticleFetchState>({
		article: null,
		isLoading: false,
		error: null,
		isPolling: false,
	});

	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const currentArticleIdRef = useRef<string | null>(null);

	/**
	 * Clear any existing polling interval
	 */
	const clearPolling = useCallback(() => {
		if (pollIntervalRef.current) {
			clearTimeout(pollIntervalRef.current);
			pollIntervalRef.current = null;
		}
		setState(prev => ({ ...prev, isPolling: false }));
	}, []);

	/**
	 * Poll article status
	 */
	const pollArticleStatus = useCallback(async (articleId: string, nextPollInterval: number = 2000) => {
		if (nextPollInterval === 0) {
			clearPolling();
			return;
		}

		setState(prev => ({ ...prev, isPolling: true }));

		pollIntervalRef.current = setTimeout(async () => {
			try {
				const response = await fetch(`/api/fetched-articles/status/${articleId}`);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const statusData = await response.json();

				setState(prev => ({
					...prev,
					article: prev.article ? { ...prev.article, ...statusData } : statusData,
					error: null
				}));

				// Continue polling if not completed/failed
				if (statusData.status === 'pending' || statusData.status === 'processing') {
					pollArticleStatus(articleId, statusData.nextPollInterval || 3000);
				} else {
					// Article completed or failed, fetch full data if completed
					if (statusData.status === 'completed') {
						await fetchFullArticle(articleId);
					}
					clearPolling();
				}

			} catch (error) {
				console.error('Error polling article status:', error);
				setState(prev => ({
					...prev,
					error: error instanceof Error ? error.message : 'Failed to poll article status',
					isPolling: false
				}));
				clearPolling();
			}
		}, nextPollInterval);
	}, [clearPolling]);

	/**
	 * Fetch full article content
	 */
	const fetchFullArticle = useCallback(async (articleId: string): Promise<FetchedArticle | null> => {
		try {
			const response = await fetch(`/api/fetched-articles/${articleId}`);

			if (!response.ok) {
				if (response.status === 202) {
					// Article still processing, get status data
					const statusData = await response.json();
					return statusData;
				}
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const articleData = await response.json();

			setState(prev => ({
				...prev,
				article: articleData,
				isLoading: false,
				error: null
			}));

			return articleData;

		} catch (error) {
			console.error('Error fetching full article:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to fetch article',
				isLoading: false
			}));
			return null;
		}
	}, []);

	/**
	 * Initiate article fetching
	 */
	const fetchArticle = useCallback(async (url: string, priority: number = 1): Promise<void> => {
		try {
			// Clear any existing state
			clearPolling();
			setState({
				article: null,
				isLoading: true,
				error: null,
				isPolling: false,
			});

			// Request article processing
			const response = await fetch('/api/fetched-articles/fetch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ url, priority }),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();
			currentArticleIdRef.current = result.id;

			setState(prev => ({
				...prev,
				article: result,
				isLoading: false,
				error: null
			}));

			// Handle different initial states
			if (result.status === 'completed' && result.cached) {
				// Article was already cached and completed
				await fetchFullArticle(result.id);
			} else if (result.status === 'pending' || result.status === 'processing') {
				// Start polling for status updates
				pollArticleStatus(result.id, result.status === 'processing' ? 2000 : 3000);
			} else if (result.status === 'failed') {
				setState(prev => ({
					...prev,
					error: result.errorMessage || 'Article processing failed'
				}));
			}

		} catch (error) {
			console.error('Error initiating article fetch:', error);
			setState(prev => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to fetch article',
				isLoading: false
			}));
		}
	}, [clearPolling, pollArticleStatus, fetchFullArticle]);

	/**
	 * Refetch current article
	 */
	const refetch = useCallback(async (): Promise<void> => {
		if (currentArticleIdRef.current) {
			setState(prev => ({ ...prev, isLoading: true, error: null }));
			await fetchFullArticle(currentArticleIdRef.current);
		}
	}, [fetchFullArticle]);

	/**
	 * Clear error state
	 */
	const clearError = useCallback(() => {
		setState(prev => ({ ...prev, error: null }));
	}, []);

	/**
	 * Cleanup on unmount
	 */
	useEffect(() => {
		return () => {
			clearPolling();
		};
	}, [clearPolling]);

	return {
		fetchArticle,
		state,
		clearError,
		refetch,
	};
}

/**
 * Hook for fetching multiple articles with queue management
 */
export function useArticleQueue() {
	const [queue, setQueue] = useState<Array<{ url: string; priority: number; status: string }>>([]);
	const [processing, setProcessing] = useState<string | null>(null);

	const addToQueue = useCallback((url: string, priority: number = 1) => {
		setQueue(prev => [...prev, { url, priority, status: 'queued' }]);
	}, []);

	const processNext = useCallback(async () => {
		if (processing || queue.length === 0) return;

		const nextItem = queue[0];
		setProcessing(nextItem.url);
		setQueue(prev => prev.slice(1));

		// Process the article (implementation depends on your needs)
		// This is just a placeholder for the queue management logic

		setProcessing(null);
	}, [queue, processing]);

	return {
		queue,
		processing,
		addToQueue,
		processNext,
	};
}