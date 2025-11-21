'use client';

import { useEffect, useRef } from 'react';
import { AD_CONFIG } from '@/lib/feed/types';

interface AdCardProps {
  slot?: string;
}

export function AdCard({ slot = AD_CONFIG.IN_FEED_AD_SLOT }: AdCardProps): React.ReactElement {
  const adRef = useRef<HTMLDivElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // 1. Only load ad once and when in viewport
    if (isAdLoaded.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isAdLoaded.current) {
            isAdLoaded.current = true;
            loadAd();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [slot]);

  const loadAd = (): void => {
    // 2. Load Google AdSense script if not already loaded
    if (typeof window !== 'undefined' && !(window as any).adsbygoogle) {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // 3. Push ad after script loads
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  };

  return (
    <div
      ref={adRef}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* 4. Ad disclosure badge */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-50">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          Ad
        </span>
        <span className="text-xs text-gray-400">Sponsored</span>
      </div>

      {/* 5. Ad content container */}
      <div className="p-4 min-h-[200px] flex items-center justify-center">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={slot.split('/')[0]}
          data-ad-slot={slot.split('/')[1]}
          data-ad-format={AD_CONFIG.AD_FORMAT}
          data-ad-layout-key={AD_CONFIG.LAYOUT_KEY}
        />
      </div>
    </div>
  );
}

// Placeholder ad for development/testing
export function AdCardPlaceholder(): React.ReactElement {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Ad disclosure badge */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-50">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          Ad
        </span>
        <span className="text-xs text-gray-400">Sponsored</span>
      </div>

      {/* Placeholder content */}
      <div className="p-4 min-h-[200px] bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-gray-400">
        <div className="w-12 h-12 mb-2 rounded-lg bg-gray-200 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <span className="text-sm font-medium">Advertisement</span>
        <span className="text-xs">Google AdSense</span>
      </div>
    </div>
  );
}
