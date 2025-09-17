import { ArticleContentSkeleton, ArticleListSkeleton } from "@/components/articles/article-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Newspaper, RefreshCw, Search } from "lucide-react";

export default function NewsLoading() {
	return (
		<div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 relative">
			{/* Sidebar skeleton */}
			<div className="flex-shrink-0 w-80">
				<div className="flex flex-col bg-card border-r border-border h-full w-full">
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b border-border">
						<div className="flex items-center space-x-2">
							<Newspaper className="h-5 w-5 text-muted-foreground" />
							<Skeleton className="h-6 w-12" />
							<Badge variant="secondary">
								<Skeleton className="h-4 w-6" />
							</Badge>
						</div>
						<button className="p-1 rounded-md hover:bg-muted transition-colors">
							<ChevronLeft className="h-4 w-4 text-muted-foreground" />
						</button>
					</div>

					{/* Search and Filters skeleton */}
					<div className="p-4 border-b border-border space-y-3">
						<div className="relative">
							<Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
							<Skeleton className="h-9 w-full rounded-md" />
						</div>

						<div className="flex items-center justify-between">
							<Skeleton className="h-7 w-32 rounded-md" />
							<Button variant="outline" size="sm" disabled>
								<RefreshCw className="h-4 w-4 text-muted-foreground" />
							</Button>
						</div>
					</div>

					{/* Articles List skeleton */}
					<div className="flex-1 overflow-y-auto">
						<ArticleListSkeleton />
					</div>
				</div>
			</div>

			{/* Main Content Area skeleton */}
			<div className="flex-1 min-w-0">
				<div className="h-full overflow-y-auto bg-background">
					<ArticleContentSkeleton />
				</div>
			</div>
		</div>
	);
}