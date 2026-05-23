'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RoomProvider } from '@/contexts/RoomContext';
import RoomStatusDashboard from '@/components/admin/RoomStatusDashboard';
import RoomAdminPanel from '@/components/admin/RoomAdminPanel';
import AdminBookingPanel from '@/components/admin/AdminBookingPanel';
import { LogOut, ArrowLeft } from 'lucide-react';

type AdminTab = 'status' | 'rooms' | 'bookings';

function DashboardInner() {
  const { isAuthenticated, isAdmin, loading: authLoading, logoutUser } = useAuth();
  const [adminTab, setAdminTab] = useState<AdminTab>('status');

  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          Please log in to access the dashboard.{' '}
          <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          You do not have admin access.{' '}
          <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
            Go home
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
        <button
          type="button"
          onClick={logoutUser}
          className="flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {([
            { key: 'status', label: 'Room Status' },
            { key: 'rooms', label: 'Manage Rooms' },
            { key: 'bookings', label: 'All Bookings' },
          ] as { key: AdminTab; label: string }[]).map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setAdminTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                adminTab === tab.key
                  ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {adminTab === 'status' && <RoomStatusDashboard />}
        {adminTab === 'rooms' && <RoomAdminPanel />}
        {adminTab === 'bookings' && <AdminBookingPanel />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <RoomProvider>
        <DashboardInner />
      </RoomProvider>
    </AuthProvider>
  );
}
