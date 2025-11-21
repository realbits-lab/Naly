'use client';

export function SkeletonCard(): React.ReactElement {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* 1. Thumbnail placeholder */}
      <div className="w-full h-[140px] bg-gray-200" />

      {/* 2. Content placeholder */}
      <div className="p-4 space-y-3">
        {/* Category & Time */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-gray-200 rounded" />
          <div className="h-5 w-3/4 bg-gray-200 rounded" />
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 pt-1">
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

// Multiple skeleton cards for initial loading
export function SkeletonFeed({ count = 3 }: { count?: number }): React.ReactElement {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
