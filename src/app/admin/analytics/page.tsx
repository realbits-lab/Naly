"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Users, UserCheck, Download, RefreshCw } from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import { EngagementChart } from "@/components/admin/engagement-chart";
import { UserTypeChart } from "@/components/admin/user-type-chart";

interface AnalyticsData {
  overview: {
    totalLikes: number;
    totalReplies: number;
    totalUsers: number;
    anonymousUsers: number;
    authenticatedUsers: number;
  };
  period: {
    period: string;
    startDate: string;
    endDate: string;
    likes: number;
    replies: number;
  };
  timeSeries: {
    dailyLikes: Array<{ date: string; count: number }>;
    dailyReplies: Array<{ date: string; count: number }>;
  };
  engagement: {
    anonymousLikes: number;
    anonymousReplies: number;
    authenticatedLikes: number;
    authenticatedReplies: number;
  };
  topContent: Array<{
    contentId: string;
    likeCount: number;
    replyCount: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/stats?period=${period}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    if (!data) return;

    const report = {
      generatedAt: new Date().toISOString(),
      period: data.period,
      overview: data.overview,
      engagement: data.engagement,
      timeSeries: data.timeSeries,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${period}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-2 text-sm text-red-600 hover:text-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor engagement metrics and user interactions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d', 'all'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p === '7d' && 'Last 7 Days'}
            {p === '30d' && 'Last 30 Days'}
            {p === '90d' && 'Last 90 Days'}
            {p === 'all' && 'All Time'}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Likes"
          value={data.overview.totalLikes}
          icon={Heart}
          color="pink"
          description={`${data.period.likes} in selected period`}
        />
        <StatsCard
          title="Total Replies"
          value={data.overview.totalReplies}
          icon={MessageCircle}
          color="blue"
          description={`${data.period.replies} in selected period`}
        />
        <StatsCard
          title="Total Users"
          value={data.overview.totalUsers}
          icon={Users}
          color="purple"
          description={`${data.overview.anonymousUsers} anonymous`}
        />
        <StatsCard
          title="Authenticated Users"
          value={data.overview.authenticatedUsers}
          icon={UserCheck}
          color="green"
          description={`${((data.overview.authenticatedUsers / data.overview.totalUsers) * 100).toFixed(1)}% of total`}
        />
      </div>

      {/* Time Series Chart */}
      <EngagementChart
        likesData={data.timeSeries.dailyLikes}
        repliesData={data.timeSeries.dailyReplies}
        title="Engagement Over Time"
      />

      {/* User Type Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <UserTypeChart
          anonymousLikes={data.engagement.anonymousLikes}
          authenticatedLikes={data.engagement.authenticatedLikes}
          anonymousReplies={data.engagement.anonymousReplies}
          authenticatedReplies={data.engagement.authenticatedReplies}
          type="likes"
        />
        <UserTypeChart
          anonymousLikes={data.engagement.anonymousLikes}
          authenticatedLikes={data.engagement.authenticatedLikes}
          anonymousReplies={data.engagement.anonymousReplies}
          authenticatedReplies={data.engagement.authenticatedReplies}
          type="replies"
        />
      </div>

      {/* Engagement Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Engagement Breakdown</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Likes</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-orange-50 p-3">
                <span className="text-sm text-gray-700">Anonymous Users</span>
                <span className="font-semibold text-orange-600">
                  {data.engagement.anonymousLikes}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                <span className="text-sm text-gray-700">Authenticated Users</span>
                <span className="font-semibold text-green-600">
                  {data.engagement.authenticatedLikes}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Replies</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-orange-50 p-3">
                <span className="text-sm text-gray-700">Anonymous Users</span>
                <span className="font-semibold text-orange-600">
                  {data.engagement.anonymousReplies}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                <span className="text-sm text-gray-700">Authenticated Users</span>
                <span className="font-semibold text-green-600">
                  {data.engagement.authenticatedReplies}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
