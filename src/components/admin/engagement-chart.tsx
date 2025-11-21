"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string;
  count: number;
}

interface EngagementChartProps {
  likesData: DataPoint[];
  repliesData: DataPoint[];
  title?: string;
}

export function EngagementChart({
  likesData,
  repliesData,
  title = "Engagement Over Time"
}: EngagementChartProps) {
  // Merge data by date
  const mergedData = [...likesData, ...repliesData].reduce((acc, item) => {
    const existing = acc.find((d) => d.date === item.date);
    if (existing) {
      // Determine if this is likes or replies based on which array it came from
      const isLikes = likesData.find(l => l.date === item.date && l.count === item.count);
      if (isLikes) {
        existing.likes = item.count;
      } else {
        existing.replies = item.count;
      }
    } else {
      const isLikes = likesData.find(l => l.date === item.date);
      acc.push({
        date: item.date,
        likes: isLikes ? item.count : 0,
        replies: isLikes ? 0 : item.count,
      });
    }
    return acc;
  }, [] as Array<{ date: string; likes: number; replies: number }>);

  // Sort by date
  mergedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format dates for display
  const formattedData = mergedData.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="likes"
            stroke="#ec4899"
            strokeWidth={2}
            dot={{ fill: '#ec4899', r: 4 }}
            activeDot={{ r: 6 }}
            name="Likes"
          />
          <Line
            type="monotone"
            dataKey="replies"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
            name="Replies"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
