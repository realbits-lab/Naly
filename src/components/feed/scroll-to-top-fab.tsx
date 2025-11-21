'use client';

import { useEffect, useState } from 'react';

interface ScrollToTopFABProps {
  showThreshold?: number;
}

export function ScrollToTopFAB({ showThreshold = 400 }: ScrollToTopFABProps): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => {
      // 1. Show FAB when scrolled past threshold
      setIsVisible(window.scrollY > showThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showThreshold]);

  const scrollToTop = (): void => {
    // 2. Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-4 z-50 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center active:scale-95 transition-all duration-200 hover:shadow-xl"
      aria-label="Scroll to top"
    >
      <svg
        className="w-5 h-5 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
}
