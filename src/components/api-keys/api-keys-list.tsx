"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Key,
  Copy,
  Trash2,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  Settings,
  Activity,
  Calendar,
  Shield,
  Zap
} from 'lucide-react';
import { CreateApiKeyDialog } from './create-api-key-dialog';
import { ApiKeyDetailsDialog } from './api-key-details-dialog';
import { formatDistance } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  lastFourChars: string;
  scopes: string[];
  rateLimit: number | null;
  ipRestrictions: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  isActive: boolean;
}

export function ApiKeysList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [revokingKey, setRevokingKey] = useState<string | null>(null);
  const [rotatingKey, setRotatingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/account/api-keys');

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      setApiKeys(data.data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setRevokingKey(keyId);
      const response = await fetch(`/api/account/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      toast.success('API key revoked successfully');
      await fetchApiKeys();
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    } finally {
      setRevokingKey(null);
    }
  };

  const handleRotate = async (keyId: string) => {
    if (!confirm('Are you sure you want to rotate this API key? The old key will be revoked immediately.')) {
      return;
    }

    try {
      setRotatingKey(keyId);
      const response = await fetch(`/api/account/api-keys/${keyId}/rotate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to rotate API key');
      }

      const data = await response.json();

      // Show the new API key to the user
      toast.success(
        <div className="space-y-2">
          <p>API key rotated successfully!</p>
          <div className="font-mono text-xs bg-background p-2 rounded border">
            {data.data.apiKey}
          </div>
          <p className="text-xs text-muted-foreground">
            Save this key securely - it won't be shown again
          </p>
        </div>,
        {
          duration: 10000,
        }
      );

      // Copy to clipboard
      await navigator.clipboard.writeText(data.data.apiKey);
      toast.success('New API key copied to clipboard');

      await fetchApiKeys();
    } catch (error) {
      console.error('Error rotating API key:', error);
      toast.error('Failed to rotate API key');
    } finally {
      setRotatingKey(null);
    }
  };

  const handleViewDetails = (key: ApiKey) => {
    setSelectedKey(key);
    setDetailsDialogOpen(true);
  };

  const getStatusBadge = (key: ApiKey) => {
    if (key.revokedAt) {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getScopesBadges = (scopes: string[]) => {
    if (scopes.includes('*')) {
      return <Badge variant="outline" className="text-xs">Full Access</Badge>;
    }
    if (scopes.includes('admin:all')) {
      return <Badge variant="outline" className="text-xs">Admin</Badge>;
    }
    return (
      <span className="text-xs text-muted-foreground">
        {scopes.length} scope{scopes.length !== 1 ? 's' : ''}
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">
            Manage your API keys for programmatic access to Naly
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first API key to get started with the Naly API
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{key.name}</CardTitle>
                      {getStatusBadge(key)}
                    </div>
                    <CardDescription className="font-mono text-xs">
                      ****{key.lastFourChars}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(key)}
                    >
                      <Activity className="h-4 w-4" />
                    </Button>
                    {key.isActive && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRotate(key.id)}
                          disabled={rotatingKey === key.id}
                        >
                          <RefreshCw className={`h-4 w-4 ${rotatingKey === key.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(key.id)}
                          disabled={revokingKey === key.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Scopes</p>
                    {getScopesBadges(key.scopes)}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Rate Limit</p>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span className="text-xs">{key.rateLimit || 100}/min</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Created</p>
                    <span className="text-xs">
                      {formatDistance(new Date(key.createdAt), new Date(), { addSuffix: true })}
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Last Used</p>
                    <span className="text-xs">
                      {key.lastUsedAt
                        ? formatDistance(new Date(key.lastUsedAt), new Date(), { addSuffix: true })
                        : 'Never'}
                    </span>
                  </div>
                </div>
                {key.ipRestrictions && key.ipRestrictions.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        IP restrictions: {key.ipRestrictions.join(', ')}
                      </span>
                    </div>
                  </div>
                )}
                {key.expiresAt && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Expires {formatDistance(new Date(key.expiresAt), new Date(), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          fetchApiKeys();
          setCreateDialogOpen(false);
        }}
      />

      {selectedKey && (
        <ApiKeyDetailsDialog
          apiKey={selectedKey}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      )}
    </div>
  );
}