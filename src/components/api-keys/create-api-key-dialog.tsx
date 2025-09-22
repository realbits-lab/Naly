"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Copy, Info } from 'lucide-react';
import { API_SCOPES } from '@/lib/services/api-key-service';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateApiKeyDialog({ open, onOpenChange, onSuccess }: CreateApiKeyDialogProps) {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [rateLimit, setRateLimit] = useState(100);
  const [expiresInDays, setExpiresInDays] = useState(90);
  const [ipRestrictions, setIpRestrictions] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please provide a name for the API key');
      return;
    }

    if (selectedScopes.length === 0) {
      toast.error('Please select at least one scope');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/account/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          scopes: selectedScopes,
          rateLimit,
          expiresInDays,
          ipRestrictions: ipRestrictions
            ? ipRestrictions.split(',').map((ip) => ip.trim())
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create API key');
      }

      const data = await response.json();
      setCreatedKey(data.data.apiKey);
      setShowKey(true);

      // Automatically copy to clipboard
      await navigator.clipboard.writeText(data.data.apiKey);
      toast.success('API key created and copied to clipboard');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyKey = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
      toast.success('API key copied to clipboard');
    }
  };

  const handleClose = () => {
    if (showKey) {
      // Reset the dialog when closing after creating a key
      setName('');
      setSelectedScopes([]);
      setRateLimit(100);
      setExpiresInDays(90);
      setIpRestrictions('');
      setCreatedKey(null);
      setShowKey(false);
      onSuccess();
    }
    onOpenChange(false);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  const toggleAllScopes = () => {
    if (selectedScopes.includes('*')) {
      setSelectedScopes([]);
    } else {
      setSelectedScopes(['*']);
    }
  };

  const scopeCategories = {
    Analytics: ['analytics:read', 'analytics:write'],
    Predictions: ['predictions:read', 'predictions:write'],
    Narratives: ['narratives:read', 'narratives:write'],
    Community: ['community:read', 'community:write'],
    Portfolio: ['portfolio:read', 'portfolio:write'],
    Events: ['events:read', 'events:write'],
    User: ['user:read', 'user:write'],
    Admin: ['admin:all', '*'],
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!showKey ? (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Configure the permissions and settings for your new API key
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Production Server, Development App"
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name to help you identify this key
                </p>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="space-y-3">
                  {Object.entries(scopeCategories).map(([category, scopes]) => (
                    <div key={category} className="space-y-2">
                      <p className="text-sm font-medium">{category}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {scopes.map((scope) => (
                          <div key={scope} className="flex items-center space-x-2">
                            <Checkbox
                              id={scope}
                              checked={selectedScopes.includes('*') || selectedScopes.includes(scope)}
                              onCheckedChange={() => toggleScope(scope)}
                              disabled={selectedScopes.includes('*') && scope !== '*'}
                            />
                            <label
                              htmlFor={scope}
                              className="text-sm cursor-pointer select-none"
                            >
                              <span className="font-mono text-xs">{scope}</span>
                              <span className="text-muted-foreground ml-2">
                                {API_SCOPES[scope as keyof typeof API_SCOPES]}
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate-limit">
                  Rate Limit: {rateLimit} requests/minute
                </Label>
                <Slider
                  id="rate-limit"
                  min={10}
                  max={1000}
                  step={10}
                  value={[rateLimit]}
                  onValueChange={(value) => setRateLimit(value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of requests allowed per minute
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">
                  Expires in: {expiresInDays} days
                </Label>
                <Slider
                  id="expires"
                  min={1}
                  max={365}
                  step={1}
                  value={[expiresInDays]}
                  onValueChange={(value) => setExpiresInDays(value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  The key will automatically expire after this period
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ip-restrictions">IP Restrictions (Optional)</Label>
                <Input
                  id="ip-restrictions"
                  value={ipRestrictions}
                  onChange={(e) => setIpRestrictions(e.target.value)}
                  placeholder="e.g., 192.168.1.1, 10.0.0.0"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of allowed IP addresses. Leave empty for no restrictions.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create API Key'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created Successfully</DialogTitle>
              <DialogDescription>
                Save this API key securely. You won't be able to see it again.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label>Your API Key</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyKey}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="font-mono text-sm break-all select-all bg-background p-3 rounded border">
                  {createdKey}
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">Important Security Notes:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>This is the only time you'll see this API key</li>
                      <li>Store it in a secure location (environment variables, secrets manager)</li>
                      <li>Never commit API keys to version control</li>
                      <li>Rotate keys regularly for enhanced security</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">How to use your API key:</p>
                <div className="font-mono text-xs bg-muted p-3 rounded">
                  <p>Authorization: Bearer {createdKey?.slice(0, 20)}...</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}