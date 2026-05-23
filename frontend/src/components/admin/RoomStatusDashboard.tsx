'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { RoomStatusInfo, RoomStatus } from '@/lib/api';
import * as api from '@/lib/api';
import {
  CalendarDays,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarClock,
} from 'lucide-react';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Jakarta';

const STATUS_META: Record<RoomStatus, { label: string; bg: string; dot: string; icon: typeof CheckCircle2 }> = {
  available: {
    label: 'Available',
    bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  occupied: {
    label: 'Occupied',
    bg: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    dot: 'bg-red-500',
    icon: XCircle,
  },
  reserved: {
    label: 'Reserved',
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
    dot: 'bg-amber-500',
    icon: CalendarClock,
  },
};

function formatTime(time: string) {
  return dayjs.utc(time).tz(TZ).format('HH:mm');
}

function shortTime(time: string) {
  return dayjs.utc(time).tz(TZ).format('HH:mm');
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Convert a time to a percentage position in the 24h timeline */
function timeToPct(time: string): number {
  const d = dayjs.utc(time).tz(TZ);
  const minutes = d.hour() * 60 + d.minute();
  return (minutes / (24 * 60)) * 100;
}

export default function RoomStatusDashboard() {
  const [statuses, setStatuses] = useState<RoomStatusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => dayjs().tz(TZ).format('YYYY-MM-DD'));
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await api.getRoomStatuses(selectedDate);
      setStatuses(data);
    } catch {
      setError('Failed to load room status');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (!document.hidden) fetchStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus, autoRefresh]);

  const handlePrevDay = () => {
    setSelectedDate((prev) => dayjs(prev).subtract(1, 'day').format('YYYY-MM-DD'));
    setExpandedRoom(null);
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => dayjs(prev).add(1, 'day').format('YYYY-MM-DD'));
    setExpandedRoom(null);
  };

  const handleToday = () => {
    setSelectedDate(dayjs().tz(TZ).format('YYYY-MM-DD'));
    setExpandedRoom(null);
  };

  const isToday = selectedDate === dayjs().tz(TZ).format('YYYY-MM-DD');

  const counts = {
    total: statuses.length,
    available: statuses.filter((s) => s.status === 'available').length,
    occupied: statuses.filter((s) => s.status === 'occupied').length,
    reserved: statuses.filter((s) => s.status === 'reserved').length,
  };

  return (
    <div className="flex flex-col gap-5" data-testid="room-status-dashboard">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Room Status
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-800">
            <CalendarDays size={14} className="text-zinc-500" />
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {dayjs(selectedDate).tz(TZ).format('MMM D, YYYY')}
            </span>
            {isToday && (
              <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                Today
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>

          {!isToday && (
            <button
              type="button"
              onClick={handleToday}
              className="flex h-8 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Today
            </button>
          )}

          <button
            type="button"
            onClick={fetchStatus}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <label className="flex items-center gap-1.5 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-3 w-3 rounded border-zinc-300"
            />
            Auto
          </label>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Rooms" value={counts.total} color="text-zinc-900 dark:text-zinc-50" icon={Users} />
        <SummaryCard label="Available" value={counts.available} color="text-emerald-600 dark:text-emerald-400" icon={CheckCircle2} />
        <SummaryCard label="Occupied" value={counts.occupied} color="text-red-600 dark:text-red-400" icon={XCircle} />
        <SummaryCard label="Reserved" value={counts.reserved} color="text-amber-600 dark:text-amber-400" icon={CalendarClock} />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
          <button type="button" onClick={fetchStatus} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* ── Loading (initial only) ── */}
      {loading && statuses.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && statuses.length === 0 && (
        <div className="flex items-center justify-center rounded-xl border border-zinc-200 py-12 text-center dark:border-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400">No rooms found</p>
        </div>
      )}

      {/* ── Card grid ── */}
      {!error && statuses.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {statuses.map((info) => {
              const meta = STATUS_META[info.status];
              const Icon = meta.icon;
              return (
                <button
                  type="button"
                  key={info.room.id}
                  onClick={() => setExpandedRoom(expandedRoom === info.room.id ? null : info.room.id)}
                  className={`relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                    expandedRoom === info.room.id
                      ? 'border-zinc-400 ring-2 ring-zinc-300 dark:border-zinc-500 dark:ring-zinc-600'
                      : meta.bg
                  }`}
                  data-testid={`room-status-card-${info.room.id}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {info.room.name}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-400">
                      <Users size={12} />
                      {info.room.capacity}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    <span className={`text-sm font-medium ${meta.dot === 'bg-emerald-500' ? 'text-emerald-700 dark:text-emerald-300' : meta.dot === 'bg-red-500' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                      {meta.label}
                    </span>
                  </div>

                  {info.currentBooking && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Clock size={12} />
                      <span>
                        {shortTime(info.currentBooking.start_time)} – {shortTime(info.currentBooking.end_time)}
                      </span>
                      <span className="ml-auto truncate max-w-[100px]" title={info.currentBooking.user_name}>
                        {info.currentBooking.user_name}
                      </span>
                    </div>
                  )}

                  {!info.currentBooking && info.nextBooking && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <CalendarClock size={12} />
                      <span>
                        Next: {shortTime(info.nextBooking.start_time)} – {shortTime(info.nextBooking.end_time)}
                      </span>
                    </div>
                  )}

                  {info.todayBookings.length > 0 && (
                    <span className="text-xs text-zinc-400">
                      {info.todayBookings.length} booking{info.todayBookings.length !== 1 ? 's' : ''} today
                    </span>
                  )}

                  <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                    <ChevronRight
                      size={12}
                      className={`transition-transform ${expandedRoom === info.room.id ? 'rotate-90' : ''}`}
                    />
                    Schedule
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Timeline for expanded room ── */}
          {expandedRoom !== null && (
            <RoomTimeline
              statuses={statuses}
              expandedRoom={expandedRoom}
              selectedDate={selectedDate}
            />
          )}

          {/* ── Full timeline (all rooms) ── */}
          <details open className="group rounded-xl border border-zinc-200 dark:border-zinc-800">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900">
              <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
              Full Day Schedule
            </summary>
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
              <TimelineChart statuses={statuses} />
            </div>
          </details>
        </>
      )}
    </div>
  );
}

/* ── Summary card ── */
function SummaryCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <Icon size={20} className="text-zinc-400" />
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

/* ── Room timeline (single room, expanded view) ── */
function RoomTimeline({
  statuses,
  expandedRoom,
  selectedDate,
}: {
  statuses: RoomStatusInfo[];
  expandedRoom: number;
  selectedDate: string;
}) {
  const info = statuses.find((s) => s.room.id === expandedRoom);
  if (!info || info.todayBookings.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        {info.room.name} — Booking Schedule
      </h4>
      <div className="space-y-2">
        {info.todayBookings.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="w-24 shrink-0 font-medium text-zinc-800 dark:text-zinc-200">
              {formatTime(b.start_time)} – {formatTime(b.end_time)}
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">{b.user_name}</span>
            {b.room && (
              <span className="ml-auto text-xs text-zinc-400">{b.room.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Full timeline chart (Gantt-style for all rooms) ── */
function TimelineChart({ statuses }: { statuses: RoomStatusInfo[] }) {
  const rowHeight = 48;
  const hourWidth = 48;
  const totalWidth = HOURS.length * hourWidth;
  const barRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(totalWidth);

  const nowPct = timeToPct(dayjs().tz(TZ).toISOString());

  // Measure actual rendered time bar width for now indicator positioning (viewport-aware)
  useEffect(() => {
    if (barRef.current) {
      const w = barRef.current.getBoundingClientRect().width;
      if (w !== barWidth) setBarWidth(w);
    }
  }, [barWidth]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="shrink-0" style={{ width: 130 }} />
          <div className="flex flex-1" style={{ minWidth: totalWidth }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="shrink-0 text-center text-[11px] text-zinc-400"
                style={{ width: `${100 / HOURS.length}%` }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Room rows */}
        <div className="relative">
          {/* "Now" indicator line */}
          {(() => {
            const now = dayjs().tz(TZ);
            const isSelectedToday =
              statuses.length > 0 &&
              now.format('YYYY-MM-DD') ===
                dayjs.utc(statuses[0]?.todayBookings[0]?.start_time || now.toISOString()).tz(TZ).format('YYYY-MM-DD');
            if (!isSelectedToday) return null;
            return (
              <div
                className="pointer-events-none absolute top-0 z-10 w-px bg-red-400"
                style={{ left: 138 + (nowPct / 100) * barWidth, height: statuses.length * (rowHeight + 8) }}
              >
                <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-400" />
              </div>
            );
          })()}

          {statuses.map((info) => (
            <div key={info.room.id} className="flex items-center gap-2 py-1" style={{ height: rowHeight + 8 }}>
              {/* Room label */}
              <div className="flex shrink-0 items-center gap-2" style={{ width: 130 }}>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    info.status === 'available'
                      ? 'bg-emerald-500'
                      : info.status === 'occupied'
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                  }`}
                />
                <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {info.room.name}
                </span>
              </div>

              <div ref={barRef} className="relative h-7 flex-1 rounded-md bg-zinc-100 dark:bg-zinc-900" style={{ minWidth: totalWidth }}>
                {info.todayBookings.map((b) => {
                  const left = timeToPct(b.start_time);
                  const right = timeToPct(b.end_time);
                  const width = Math.max(right - left, 0.5);

                  return (
                    <div
                      key={b.id}
                      className="absolute top-0.5 flex h-6 items-center overflow-hidden rounded px-1.5 text-[11px] font-medium text-white"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        minWidth: 20,
                        backgroundColor: info.status === 'occupied' ? '#ef4444' : '#3b82f6',
                      }}
                      title={`${b.user_name}: ${formatTime(b.start_time)} – ${formatTime(b.end_time)}`}
                    >
                      <span className="truncate" title={`${b.user_name}: ${formatTime(b.start_time)} – ${formatTime(b.end_time)}`}>
                        {shortTime(b.start_time)}–{shortTime(b.end_time)} {b.user_name}
                      </span>
                    </div>
                  );
                })}

                {/* Hour grid lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 h-full border-l border-zinc-200/50 dark:border-zinc-700/50"
                    style={{ left: `${(h / 24) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            Booking
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
            Currently occupied
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 bg-red-400" />
            Now
          </span>
        </div>
      </div>
    </div>
  );
}
