'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createBooking } from '@/lib/api';

const bookingSchema = z.object({
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: 'End time must be after start time',
  path: ['end_time'],
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingCreateFormProps {
  roomId: number;
  onSuccess?: () => void;
}

export default function BookingCreateForm({ roomId, onSuccess }: BookingCreateFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = async (data: BookingFormData) => {
    setError(null);
    setSuccess(null);
    try {
      await createBooking({ room_id: roomId, start_time: data.start_time, end_time: data.end_time });
      setSuccess('Booking created!');
      reset();
      onSuccess?.();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('This time slot overlaps with an existing booking');
      } else if (err.response?.status === 422) {
        const serverErrors = err.response?.data?.errors;
        if (serverErrors) {
          Object.entries(serverErrors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              setFieldError(field as keyof BookingFormData, { message: messages[0] });
            }
          });
        }
      } else {
        setError('Failed to create booking. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="create-booking-form">
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" data-testid="booking-error">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="start_time" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Start Time
        </label>
        <input
          id="start_time"
          type="datetime-local"
          {...register('start_time')}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          data-testid="start-time-input"
        />
        {errors.start_time && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.start_time.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="end_time" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          End Time
        </label>
        <input
          id="end_time"
          type="datetime-local"
          {...register('end_time')}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          data-testid="end-time-input"
        />
        {errors.end_time && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.end_time.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        data-testid="submit-booking"
      >
        {isSubmitting ? 'Creating...' : 'Create Booking'}
      </button>
    </form>
  );
}
