'use client';

import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getRoomBookings, deleteBooking, getUserTimezone, type Booking } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

dayjs.extend(utc);
dayjs.extend(timezone);

const formatTime = (time: string) => dayjs.utc(time).tz(getUserTimezone()).format('HH:mm');

interface BookingListProps {
  roomId: number;
  date: string;
  refreshKey?: number;
}

export default function BookingList({ roomId, date, refreshKey }: BookingListProps) {
  const { user, isAdmin } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRoomBookings(roomId, date, { page, per_page: 20 });
      setBookings(response.data);
      setTotalPages(response.meta?.last_page ?? 1);
    } catch {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [roomId, date, page]);

  useEffect(() => {
    void refreshKey;
    fetchBookings();
  }, [fetchBookings, refreshKey]);

  useEffect(() => {
    void roomId;
    void date;
    setPage(1);
  }, [roomId, date]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await deleteBooking(id);
      await fetchBookings();
    } catch {
      alert('Failed to delete booking');
    }
  };

  const canDelete = (booking: Booking) => {
    if (isAdmin) return true;
    if (user && booking.user_name === user.name) return true;
    return false;
  };

  if (loading) {
    return (
      <div data-testid="booking-list" className="flex flex-col gap-3">
        <p className="text-zinc-600 dark:text-zinc-400">Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="booking-list" className="flex flex-col items-center gap-4 rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
        <button
          type="button"
          onClick={fetchBookings}
          className="flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div data-testid="booking-list" className="flex flex-col gap-3">

      {bookings.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p data-testid="booking-empty" className="text-zinc-600 dark:text-zinc-400">
            No bookings for this date
          </p>
        </div>
      ) : (
        bookings.map((booking) => (
          <div
            key={booking.id}
            data-testid={`booking-item-${booking.id}`}
            className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">{booking.user_name}</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
              </span>
            </div>
            {canDelete(booking) && (
              <button
                type="button"
                onClick={() => handleDelete(booking.id)}
                data-testid={`delete-booking-${booking.id}`}
                className="flex h-8 items-center justify-center rounded-full border border-solid border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                Delete
              </button>
            )}
          </div>
        ))
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1 || loading}
          className="flex h-9 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Prev
        </button>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Page {page} of {Math.max(1, totalPages)}</p>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(Math.max(1, totalPages), prev + 1))}
          disabled={page >= Math.max(1, totalPages) || loading}
          className="flex h-9 items-center justify-center rounded-full border border-zinc-200 px-4 text-sm font-medium text-foreground transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Next
        </button>
      </div>
    </div>
  );
}
