'use client';

import { useState } from 'react';
import { useRooms } from '@/contexts/RoomContext';
import dayjs from 'dayjs';
import BookingList from './BookingList';
import BookingCreateForm from './BookingCreateForm';

export default function RoomDetail() {
  const { selectedRoom, refreshBookings } = useRooms();
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));

  if (!selectedRoom) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">{selectedRoom.name}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Capacity: {selectedRoom.capacity}</p>
      </div>

      <div>
        <label htmlFor="booking-date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Date
        </label>
        <input
          id="booking-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded p-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          data-testid="booking-date"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium text-foreground">Bookings</h3>
        <BookingList roomId={selectedRoom.id} date={date} onDateChange={setDate} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium text-foreground">New Booking</h3>
        <BookingCreateForm roomId={selectedRoom.id} onSuccess={refreshBookings} />
      </div>
    </div>
  );
}
