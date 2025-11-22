"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface UserTypeChartProps {
  anonymousLikes: number;
  authenticatedLikes: number;
  anonymousReplies: number;
  authenticatedReplies: number;
  type: 'likes' | 'replies';
}

const COLORS = {
  anonymous: '#f59e0b',
  authenticated: '#10b981',
};

export function UserTypeChart({
  anonymousLikes,
  authenticatedLikes,
  anonymousReplies,
  authenticatedReplies,
  type,
}: UserTypeChartProps) {
  const data = type === 'likes'
    ? [
        { name: 'Anonymous Users', value: anonymousLikes, color: COLORS.anonymous },
        { name: 'Authenticated Users', value: authenticatedLikes, color: COLORS.authenticated },
      ]
    : [
        { name: 'Anonymous Users', value: anonymousReplies, color: COLORS.anonymous },
        { name: 'Authenticated Users', value: authenticatedReplies, color: COLORS.authenticated },
      ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        {type === 'likes' ? 'Likes' : 'Replies'} by User Type
      </h3>
      {total > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[250px] items-center justify-center text-gray-400">
          No data available
        </div>
      )}
    </div>
  );
}
