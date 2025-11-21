import Link from 'next/link';
import { LayoutDashboard, Settings, History, LogOut } from 'lucide-react';
import { signOut } from '@/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="flex h-16 items-center justify-center border-b">
          <h1 className="text-xl font-bold text-gray-800">Naly Admin</h1>
        </div>
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
            <Link
              href="/admin/agents"
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <Settings size={20} />
              Agent Settings
            </Link>
            <Link
              href="/admin/history"
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <History size={20} />
              Run History
            </Link>
          </div>
        </nav>
        <div className="absolute bottom-0 w-64 border-t p-4">
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-red-600 hover:bg-red-50">
              <LogOut size={20} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
