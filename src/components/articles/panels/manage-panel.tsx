"use client";

import { ArticleManagement } from "@/components/articles/article-management";

export function ManagePanel() {
	return (
		<div className="h-full overflow-auto">
			<div className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-foreground">
						Article Management
					</h1>
					<p className="text-muted-foreground mt-1">
						Manage, edit, and organize your published articles
					</p>
				</div>

				<ArticleManagement />
			</div>
		</div>
	);
}
