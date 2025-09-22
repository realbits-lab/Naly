import { Skeleton } from "@/components/ui/skeleton";

export function NewsSidebarSkeleton() {
	return (
		<div className="flex flex-col bg-card md:border-r border-border h-full w-full">
			{/* Header skeleton */}
			<div className="flex items-center justify-between p-4 border-b border-border">
				<div className="flex items-center space-x-2">
					<Skeleton className="h-5 w-5 rounded animate-pulse" />
					<Skeleton className="h-6 w-12 animate-pulse" />
					<Skeleton className="h-5 w-8 rounded animate-pulse" />
				</div>
				<Skeleton className="h-6 w-6 rounded animate-pulse" />
			</div>

			{/* Search and filters skeleton */}
			<div className="p-4 border-b border-border space-y-3">
				{/* Search input skeleton */}
				<div className="flex items-center gap-2">
					<Skeleton className="flex-1 h-10 rounded-md animate-pulse" />
					<Skeleton className="h-4 w-4 animate-pulse" />
				</div>

				{/* Filters skeleton */}
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-32 rounded-md animate-pulse" />
					<div className="flex items-center gap-2">
						<Skeleton className="h-8 w-8 rounded animate-pulse" />
						<Skeleton className="h-8 w-8 rounded animate-pulse" />
					</div>
				</div>

				{/* Cache stats toggle skeleton */}
				<Skeleton className="h-4 w-24 animate-pulse" />
			</div>

			{/* Articles list skeleton */}
			<div className="flex-1 overflow-y-auto">
				<ArticleListSkeleton />
			</div>
		</div>
	);
}

export function ArticleListSkeleton() {
	return (
		<div className="p-2 space-y-2">
			{[...Array(8)].map((_, i) => (
				<div
					key={i}
					className="w-full p-3 mb-2 rounded-lg border bg-card transition-all duration-200"
				>
					<div className="space-y-3">
						{/* Title skeleton */}
						<div className="space-y-2">
							<Skeleton className="h-4 w-full animate-pulse" />
							<Skeleton className="h-4 w-4/5 animate-pulse" />
							<Skeleton className="h-4 w-3/4 animate-pulse" />
						</div>

						{/* Summary skeleton */}
						<div className="space-y-2">
							<Skeleton className="h-3 w-full animate-pulse" />
							<Skeleton className="h-3 w-2/3 animate-pulse" />
						</div>

						{/* Tickers skeleton */}
						<div className="flex gap-1">
							<Skeleton className="h-5 w-12 rounded animate-pulse" />
							<Skeleton className="h-5 w-10 rounded animate-pulse" />
							<Skeleton className="h-5 w-8 rounded animate-pulse" />
						</div>

						{/* Metadata skeleton */}
						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<Skeleton className="h-3 w-3 rounded-full mr-2 animate-pulse" />
								<Skeleton className="h-3 w-24 animate-pulse" />
							</div>
							<div className="flex items-center gap-1">
								<Skeleton className="h-5 w-12 rounded animate-pulse" />
								<Skeleton className="h-5 w-16 rounded animate-pulse" />
							</div>
						</div>

						{/* Publisher skeleton */}
						<div className="flex items-center justify-between text-xs">
							<Skeleton className="h-3 w-20 animate-pulse" />
							<Skeleton className="h-3 w-16 animate-pulse" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

export function ArticleContentSkeleton() {
	return (
		<div className="h-full overflow-y-auto bg-background">
			<div className="max-w-4xl mx-auto p-6 min-h-full">
				{/* Title skeleton */}
				<div className="mb-8">
					<div className="space-y-3 mb-4">
						<Skeleton className="h-9 w-full animate-pulse" />
						<Skeleton className="h-9 w-4/5 animate-pulse" />
						<Skeleton className="h-9 w-3/4 animate-pulse" />
					</div>

					{/* Summary skeleton */}
					<div className="space-y-3 mb-6">
						<Skeleton className="h-6 w-full animate-pulse" />
						<Skeleton className="h-6 w-5/6 animate-pulse" />
						<Skeleton className="h-6 w-4/5 animate-pulse" />
					</div>

					{/* Metadata skeleton */}
					<div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border mb-4">
						<div className="flex items-center">
							<Skeleton className="h-4 w-4 mr-2 rounded animate-pulse" />
							<Skeleton className="h-4 w-32 animate-pulse" />
						</div>
						<div className="flex items-center">
							<Skeleton className="h-4 w-4 mr-2 rounded animate-pulse" />
							<Skeleton className="h-4 w-20 animate-pulse" />
						</div>
						<div className="flex items-center">
							<Skeleton className="h-4 w-4 mr-2 rounded animate-pulse" />
							<Skeleton className="h-4 w-24 animate-pulse" />
						</div>
						<Skeleton className="h-6 w-20 rounded-full animate-pulse" />
						<Skeleton className="h-6 w-16 rounded-full animate-pulse" />
					</div>

					{/* Action buttons skeleton */}
					<div className="flex items-center gap-2 mt-4">
						<Skeleton className="h-9 w-20 rounded-md animate-pulse" />
						<Skeleton className="h-9 w-24 rounded-md animate-pulse" />
						<Skeleton className="h-9 w-32 rounded-md animate-pulse" />
					</div>
				</div>

				{/* Content skeleton */}
				<div className="prose prose-lg max-w-none">
					<div className="space-y-6">
						{[...Array(12)].map((_, i) => (
							<div key={i} className="space-y-3">
								<Skeleton className="h-4 w-full animate-pulse" />
								<Skeleton className="h-4 w-11/12 animate-pulse" />
								<Skeleton className="h-4 w-5/6 animate-pulse" />
								<Skeleton className="h-4 w-4/5 animate-pulse" />
								{(i + 1) % 3 === 0 && <div className="py-3" />}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export function EmptyArticleState() {
	return (
		<div className="h-full flex items-center justify-center bg-muted/20">
			<div className="text-center space-y-4 max-w-md px-6">
				<div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
					<div className="w-8 h-8 bg-muted-foreground/20 rounded" />
				</div>
				<div>
					<h3 className="text-lg font-medium text-foreground">
						Select an Article
					</h3>
					<p className="text-muted-foreground">
						Choose an article from the sidebar to view its content
					</p>
				</div>
			</div>
		</div>
	);
}