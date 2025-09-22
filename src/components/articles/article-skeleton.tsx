import { Skeleton } from "@/components/ui/skeleton";

export function ArticleListSkeleton() {
	return (
		<div className="p-2 space-y-2">
			{[...Array(6)].map((_, i) => (
				<div
					key={i}
					className="w-full p-3 mb-2 rounded-lg border bg-card"
				>
					<div className="space-y-2">
						{/* Title skeleton */}
						<div className="space-y-1">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-4/5" />
							<Skeleton className="h-4 w-3/4" />
						</div>

						{/* Summary skeleton */}
						<div className="space-y-1">
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-2/3" />
						</div>

						{/* Metadata skeleton */}
						<div className="flex items-center justify-between">
							<div className="flex items-center">
								<Skeleton className="h-3 w-3 rounded-full mr-1" />
								<Skeleton className="h-3 w-20" />
							</div>
							<Skeleton className="h-5 w-16 rounded-full" />
						</div>

						{/* Publisher skeleton */}
						<Skeleton className="h-3 w-24" />
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