'use client';

import { useEffect, useState } from 'react';

interface CollapsibleHeaderProps {
  title?: string;
}

export function CollapsibleHeader({ title = 'NALY' }: CollapsibleHeaderProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = (): void => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 50;

      // 1. Show header when scrolling up or at top
      if (currentScrollY < scrollThreshold) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-transform duration-200 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-center">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
      </div>
    </header>
  );
}
