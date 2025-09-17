"use client";

import MarkdownPreview from "@uiw/react-markdown-preview";
import { Card, CardContent } from "@/components/ui/card";

interface MarkdownContentProps {
	content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
	return (
		<Card>
			<CardContent className="p-0">
				<MarkdownPreview
					source={content}
					style={{
						backgroundColor: "transparent",
						padding: "1.5rem",
					}}
					data-color-mode="auto"
				/>
			</CardContent>
		</Card>
	);
}
