'use client';

import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTimezone, type Booking } from '@/lib/api';
import * as api from '@/lib/api';

dayjs.extend(utc);
dayjs.extend(timezone);

const formatTime = (time: string) =>
  dayjs.utc(time).tz(getUserTimezone()).format('MMM D, HH:mm');

export default function AdminBookingPanel() {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(dayjs().subtract(3, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().add(3, 'day').format('YYYY-MM-DD'));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tz = getUserTimezone();
      const date_from = dayjs.tz(startDate, tz).startOf('day').utc().toISOString();
      const date_to = dayjs.tz(endDate, tz).endOf('day').utc().toISOString();
      const response = await api.getBookings({ filter: 'all', date_from, date_to, page, per_page: 20 });
      setBookings(response.data);
      setTotalPages(response.meta?.last_page ?? 1);
    } catch {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    void startDate;
    void endDate;
    setPage(1);
  }, [startDate, endDate]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await api.deleteBooking(id);
      await fetchBookings();
    } catch {
      alert('Failed to delete booking');
    }
  };

  if (!isAdmin) return null;

  return (
    <div data-testid="admin-booking-panel" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Admin — All Bookings</h2>
        <button
          type="button"
          onClick={fetchBookings}
          className="flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="admin-start-date" className="text-sm font-medium text-foreground">
            From
          </label>
          <input
            id="admin-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-800"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="admin-end-date" className="text-sm font-medium text-foreground">
            To
          </label>
          <input
            id="admin-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-800"
          />
        </div>
      </div>

      {loading && <p className="text-zinc-600 dark:text-zinc-400">Loading bookings...</p>}

      {error && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
          <button
            type="button"
            onClick={fetchBookings}
            className="flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="flex items-center justify-center rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">No bookings found for this period</p>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Room</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">User</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Start Time</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">End Time</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-3 text-foreground">
                      {booking.room?.name || `Room ${booking.room_id}`}
                    </td>
                    <td className="px-4 py-3 text-foreground">{booking.user_name}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatTime(booking.start_time)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatTime(booking.end_time)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(booking.id)}
                        data-testid={`admin-delete-booking-${booking.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-full border border-solid border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        </>
      )}
    </div>
  );
}
