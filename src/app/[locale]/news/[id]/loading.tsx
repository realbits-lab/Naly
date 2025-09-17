import { ArrowLeft, Calendar, Clock, Tag, TrendingUp, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleLoading() {
	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			{/* Back link skeleton */}
			<div className="mb-6">
				<div className="inline-flex items-center text-sm">
					<ArrowLeft className="mr-2 h-4 w-4 text-muted-foreground" />
					<Skeleton className="h-4 w-24" />
				</div>
			</div>

			<article className="space-y-6">
				{/* Header skeleton */}
				<header className="space-y-4">
					{/* Title skeleton */}
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-4/5" />
						<Skeleton className="h-8 w-3/4" />
					</div>

					{/* Metadata skeleton */}
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center">
							<Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
							<Skeleton className="h-4 w-24" />
						</div>
						<div className="flex items-center">
							<Clock className="mr-1 h-4 w-4 text-muted-foreground" />
							<Skeleton className="h-4 w-16" />
						</div>
						<div className="flex items-center">
							<User className="mr-1 h-4 w-4 text-muted-foreground" />
							<Skeleton className="h-4 w-20" />
						</div>
						<div className="flex items-center">
							<TrendingUp className="mr-1 h-4 w-4 text-muted-foreground" />
							<Skeleton className="h-4 w-16" />
						</div>
						<div className="flex items-center">
							<Tag className="mr-1 h-4 w-4 text-muted-foreground" />
							<Skeleton className="h-4 w-18" />
						</div>
					</div>
				</header>

				{/* Summary skeleton */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-20" />
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-5/6" />
							<Skeleton className="h-4 w-4/5" />
						</div>
					</CardContent>
				</Card>

				{/* Content skeleton */}
				<div className="space-y-4">
					{[...Array(12)].map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-5/6" />
							<Skeleton className="h-4 w-4/5" />
							{(i + 1) % 4 === 0 && <div className="py-2" />}
						</div>
					))}
				</div>

				{/* Key Points skeleton */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-24" />
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{[...Array(4)].map((_, i) => (
								<div key={i} className="flex items-start">
									<div className="w-2 h-2 bg-muted rounded-full mt-2 mr-3 flex-shrink-0" />
									<Skeleton className="h-4 flex-1" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Market Analysis skeleton */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-5/6" />
							<Skeleton className="h-4 w-4/5" />
						</div>
					</CardContent>
				</Card>

				{/* Investment Implications skeleton */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40" />
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-5/6" />
							<Skeleton className="h-4 w-4/5" />
						</div>
					</CardContent>
				</Card>

				{/* Keywords skeleton */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-20" />
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{[...Array(8)].map((_, i) => (
								<Skeleton
									key={i}
									className="h-6 rounded-full"
									style={{ width: `${Math.floor(Math.random() * 40) + 60}px` }}
								/>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Source skeleton */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-16" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-4 w-64" />
						<Skeleton className="h-3 w-32 mt-1" />
					</CardContent>
				</Card>
			</article>
		</div>
	);
}