'use client';

import { useRooms } from '@/contexts/RoomContext';

export default function RoomList() {
  const { rooms, selectedRoom, selectRoom, loading, error } = useRooms();

  if (loading && rooms.length === 0) {
    return (
      <div data-testid="room-list" className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="room-list" className="flex items-center justify-center rounded-xl border border-red-200 p-4 text-red-600 dark:border-red-900 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div data-testid="room-list" className="flex items-center justify-center rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">No rooms available</p>
      </div>
    );
  }

  return (
    <div data-testid="room-list" className="flex flex-col gap-3">
      {rooms.map((room) => {
        const isSelected = selectedRoom?.id === room.id;
        return (
          <button
            key={room.id}
            data-testid={`room-item-${room.id}`}
            onClick={() => selectRoom(room)}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
            }`}
          >
            <span className="text-sm font-semibold text-foreground">{room.name}</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Capacity: {room.capacity}</span>
          </button>
        );
      })}
    </div>
  );
}
