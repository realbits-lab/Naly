"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  TrendingUp,
  AlertCircle,
  Clock,
  Globe,
  Zap,
  CheckCircle,
  XCircle,
  Server
} from 'lucide-react';
import { formatDistance, format } from 'date-fns';

interface ApiKeyDetailsDialogProps {
  apiKey: {
    id: string;
    name: string;
    lastFourChars: string;
    scopes: string[];
    rateLimit: number | null;
    createdAt: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ApiKeyStats {
  key: any;
  stats: {
    usage: any[];
    totalRequests: number;
    totalErrors: number;
    avgResponseTime: number;
  };
  recentLogs: any[];
}

interface LogDetails {
  logs: any[];
  usageStats: any[];
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    uniqueEndpoints: number;
    uniqueIPs: number;
    errorRate: string;
  };
  endpointStats: Record<string, any>;
}

export function ApiKeyDetailsDialog({ apiKey, open, onOpenChange }: ApiKeyDetailsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ApiKeyStats | null>(null);
  const [logs, setLogs] = useState<LogDetails | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (open && apiKey) {
      fetchDetails();
    }
  }, [open, apiKey]);

  const fetchDetails = async () => {
    try {
      setLoading(true);

      // Fetch basic stats
      const statsResponse = await fetch(`/api/account/api-keys/${apiKey.id}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Fetch detailed logs
      const logsResponse = await fetch(`/api/account/api-keys/${apiKey.id}/logs?days=7&limit=100`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData.data);
      }
    } catch (error) {
      console.error('Error fetching API key details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode < 300) return 'text-green-600 dark:text-green-400';
    if (statusCode < 400) return 'text-blue-600 dark:text-blue-400';
    if (statusCode < 500) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[method] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{apiKey.name}</DialogTitle>
          <DialogDescription>
            API Key ending in {apiKey.lastFourChars} • Created {formatDistance(new Date(apiKey.createdAt), new Date(), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs">Recent Logs</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <TabsContent value="overview" className="space-y-4">
                {logs && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Requests
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{logs.summary.totalRequests}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Success Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(100 - parseFloat(logs.summary.errorRate)).toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Avg Response Time
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{logs.summary.avgResponseTime}ms</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Rate Limit
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{apiKey.rateLimit || 100}/min</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {apiKey.scopes.map((scope) => (
                        <Badge key={scope} variant="outline">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {stats && stats.stats.usage.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Usage (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stats.stats.usage.slice(0, 7).map((day) => (
                          <div key={day.date} className="flex items-center justify-between text-sm">
                            <span>{format(new Date(day.date), 'MMM d')}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">
                                {day.requestCount} requests
                              </span>
                              {day.errorCount > 0 && (
                                <span className="text-destructive">
                                  {day.errorCount} errors
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                {logs && logs.logs.length > 0 ? (
                  <ScrollArea className="h-[400px] w-full rounded-md border">
                    <div className="p-4 space-y-2">
                      {logs.logs.map((log, index) => (
                        <div
                          key={`${log.id}-${index}`}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <Badge className={getMethodColor(log.method)}>
                              {log.method}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-mono truncate">{log.endpoint}</p>
                              <span className={`text-sm font-medium ${getStatusColor(log.statusCode)}`}>
                                {log.statusCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {log.responseTime}ms
                              </span>
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {log.ipAddress || 'Unknown'}
                              </span>
                              <span>
                                {formatDistance(new Date(log.timestamp), new Date(), { addSuffix: true })}
                              </span>
                            </div>
                            {log.errorMessage && (
                              <p className="text-xs text-destructive mt-1">{log.errorMessage}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">
                          No API requests logged yet
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="endpoints" className="space-y-4">
                {logs && Object.keys(logs.endpointStats).length > 0 ? (
                  <ScrollArea className="h-[400px] w-full rounded-md border">
                    <div className="p-4 space-y-2">
                      {Object.entries(logs.endpointStats)
                        .sort((a, b) => b[1].count - a[1].count)
                        .map(([endpoint, stats]: [string, any]) => (
                          <Card key={endpoint}>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <p className="font-mono text-sm">{endpoint}</p>
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Requests</p>
                                    <p className="font-medium">{stats.count}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Success Rate</p>
                                    <p className="font-medium">
                                      {(100 - parseFloat(stats.errorRate)).toFixed(1)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Avg Time</p>
                                    <p className="font-medium">{stats.avgResponseTime}ms</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Errors</p>
                                    <p className="font-medium text-destructive">{stats.errors}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">
                          No endpoint statistics available yet
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}