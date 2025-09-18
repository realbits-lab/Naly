"use client";

import { useState, useEffect } from "react";

interface ScreenSize {
	width: number;
	height: number;
}

export function useScreenSize(): ScreenSize {
	const [screenSize, setScreenSize] = useState<ScreenSize>({
		width: 0,
		height: 0,
	});

	useEffect(() => {
		function updateSize() {
			setScreenSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		}

		// Set initial size
		updateSize();

		// Add event listener
		window.addEventListener("resize", updateSize);

		// Cleanup
		return () => window.removeEventListener("resize", updateSize);
	}, []);

	return screenSize;
}