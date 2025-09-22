import { Metadata } from 'next';
import { ApiKeysList } from '@/components/api-keys/api-keys-list';

export const metadata: Metadata = {
  title: 'API Keys - Naly',
  description: 'Manage your API keys for programmatic access to Naly',
};

export default function ApiKeysPage() {
  return (
    <div className="container max-w-6xl py-8">
      <ApiKeysList />
    </div>
  );
}