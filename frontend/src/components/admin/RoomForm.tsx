'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as api from '@/lib/api';
import type { AxiosError } from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const roomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface RoomFormProps {
  room?: api.Room | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RoomForm({ room, onSuccess, onCancel }: RoomFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!room;
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: room?.name ?? '',
      capacity: room?.capacity ?? 1,
    },
  });

  const onSubmit = async (data: RoomFormData) => {
    setError(null);
    try {
      if (isEditMode && room) {
        await api.updateRoom(room.id, data);
      } else {
        await api.createRoom(data);
      }
      onSuccess();
    } catch (err) {
      const error = err as AxiosError<{ errors?: Record<string, string[]> }>;
      if (error.response?.status === 422) {
        const serverErrors = error.response?.data?.errors;
        if (serverErrors) {
          Object.entries(serverErrors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              setFieldError(field as keyof RoomFormData, { message: messages[0] });
            }
          });
        }
      } else {
        setError(isEditMode ? 'Failed to update room. Please try again.' : 'Failed to create room. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="room-form">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" data-testid="room-form-error">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="room-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name
        </label>
        <input
          id="room-name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          data-testid="room-name-input"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="room-capacity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Capacity
        </label>
        <input
          id="room-capacity"
          type="number"
          {...register('capacity', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          data-testid="room-capacity-input"
        />
        {errors.capacity && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.capacity.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-10 flex-1 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          data-testid="room-form-submit"
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Room' : 'Create Room'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          data-testid="room-form-cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
