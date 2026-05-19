'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Room, Booking } from '@/lib/api';
import * as api from '@/lib/api';

interface RoomContextType {
  rooms: Room[];
  selectedRoom: Room | null;
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  loadRooms: () => Promise<void>;
  selectRoom: (room: Room) => Promise<void>;
  loadBookings: (roomId: number, date?: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getRooms();
      setRooms(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async (roomId: number, date?: string) => {
    try {
      const response = await api.getRoomBookings(roomId, date);
      setBookings(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load bookings');
    }
  }, []);

  const selectRoom = useCallback(async (room: Room) => {
    setSelectedRoom(room);
    await loadBookings(room.id);
  }, [loadBookings]);

  const refreshBookings = useCallback(async () => {
    if (selectedRoom) {
      await loadBookings(selectedRoom.id);
    }
  }, [selectedRoom, loadBookings]);

  return (
    <RoomContext.Provider value={{ rooms, selectedRoom, bookings, loading, error, loadRooms, selectRoom, loadBookings, refreshBookings }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRooms(): RoomContextType {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRooms must be used within RoomProvider');
  return context;
}
