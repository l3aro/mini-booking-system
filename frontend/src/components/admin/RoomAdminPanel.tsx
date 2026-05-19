'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Room } from '@/lib/api';
import * as api from '@/lib/api';
import RoomForm from './RoomForm';

export default function RoomAdminPanel() {
  const { isAdmin } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getRooms();
      setRooms(response.data);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await api.deleteRoom(id);
      await fetchRooms();
    } catch {
      alert('Failed to delete room');
    }
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setShowForm(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRoom(null);
    fetchRooms();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRoom(null);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div data-testid="room-admin-panel" className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Admin — Room Management</h2>
        {!showForm && (
          <button
            onClick={handleAdd}
            className="flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            data-testid="add-room-btn"
          >
            Add Room
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {editingRoom ? 'Edit Room' : 'Add Room'}
          </h3>
          <RoomForm room={editingRoom} onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
        </div>
      )}

      {loading ? (
        <p className="text-zinc-600 dark:text-zinc-400">Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">No rooms yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Name</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Capacity</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">{room.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{room.capacity}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(room)}
                        className="flex h-8 items-center justify-center rounded-full border border-solid border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        data-testid={`edit-room-${room.id}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="flex h-8 items-center justify-center rounded-full border border-solid border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                        data-testid={`delete-room-${room.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
