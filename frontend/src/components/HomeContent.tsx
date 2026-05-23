'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RoomProvider, useRooms } from '@/contexts/RoomContext';
import RoomList from '@/components/RoomList';
import RoomDetail from '@/components/RoomDetail';
import { LogOut, LayoutDashboard } from 'lucide-react';

function HomeInner() {
  const { isAuthenticated, isAdmin, loading: authLoading, logoutUser } = useAuth();
  const { loadRooms, selectedRoom } = useRooms();

  useEffect(() => {
    if (isAuthenticated) {
      loadRooms();
    }
  }, [isAuthenticated, loadRooms]);

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
          Please log in to book a room.{' '}
          <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/dashboard"
              className="flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <LayoutDashboard size={14} />
              Admin Dashboard
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={logoutUser}
          className="flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-80">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Rooms</h2>
          <RoomList />
        </aside>
        <main className="flex-1">
          {selectedRoom ? (
            <RoomDetail />
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-zinc-200 p-12 text-center dark:border-zinc-800">
              <p className="text-zinc-600 dark:text-zinc-400">Select a room to view details</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function HomeContent() {
  return (
    <AuthProvider>
      <RoomProvider>
        <HomeInner />
      </RoomProvider>
    </AuthProvider>
  );
}
