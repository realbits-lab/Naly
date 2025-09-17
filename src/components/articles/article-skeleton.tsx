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
		<div className="max-w-4xl mx-auto p-6">
			{/* Title skeleton */}
			<div className="mb-8">
				<div className="space-y-2 mb-4">
					<Skeleton className="h-8 w-full" />
					<Skeleton className="h-8 w-4/5" />
					<Skeleton className="h-8 w-3/4" />
				</div>

				{/* Summary skeleton */}
				<div className="space-y-2 mb-6">
					<Skeleton className="h-5 w-full" />
					<Skeleton className="h-5 w-5/6" />
					<Skeleton className="h-5 w-4/5" />
				</div>

				{/* Metadata skeleton */}
				<div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border mb-4">
					<div className="flex items-center">
						<Skeleton className="h-4 w-4 mr-2" />
						<Skeleton className="h-4 w-32" />
					</div>
					<div className="flex items-center">
						<Skeleton className="h-4 w-4 mr-2" />
						<Skeleton className="h-4 w-20" />
					</div>
					<div className="flex items-center">
						<Skeleton className="h-4 w-4 mr-2" />
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="h-6 w-20 rounded-full" />
					<Skeleton className="h-6 w-16 rounded-full" />
				</div>

				{/* Action buttons skeleton */}
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-8 w-32" />
				</div>
			</div>

			{/* Content skeleton */}
			<div className="space-y-4">
				{[...Array(8)].map((_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-5/6" />
						<Skeleton className="h-4 w-4/5" />
						{i === 3 && <div className="py-2" />} {/* Add spacing for paragraphs */}
					</div>
				))}
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