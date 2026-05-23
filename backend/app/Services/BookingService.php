<?php

namespace App\Services;

use App\Exceptions\BookingConflictException;
use App\Models\Booking;
use App\Models\User;
use App\Repositories\BookingRepository;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class BookingService
{
    public function __construct(private BookingRepository $bookingRepo) {}

    public function createBooking(array $data, User $user): Booking
    {
        $start = Carbon::parse($data['start_time']);
        $end = Carbon::parse($data['end_time']);

        if (! $this->isTimeSlotAvailable((int) $data['room_id'], $start, $end)) {
            throw new BookingConflictException('Room already booked for selected time slot.');
        }

        return DB::transaction(function () use ($data, $user) {
            $data['user_id'] = $data['user_id'] ?? $user->id;

            return Booking::create($data);
        });
    }

    public function isTimeSlotAvailable(int $roomId, Carbon $start, Carbon $end, ?int $excludeBookingId = null): bool
    {
        return $this->bookingRepo->findOverlapping($roomId, $start, $end, $excludeBookingId)->isEmpty();
    }

    public function deleteBooking(int $id, User $user): bool
    {
        $booking = $this->bookingRepo->findById($id);

        if (! $booking) {
            return false;
        }

        if (! $user->is_admin && $booking->user_id !== $user->id) {
            return false;
        }

        return $this->bookingRepo->delete($id);
    }

    public function getRoomAvailability(int $roomId, string $date): Collection
    {
        return $this->bookingRepo->findByRoomAndDate($roomId, $date);
    }

    public function getRoomBookings(int $roomId, ?string $date, ?string $dateFrom, ?string $dateTo, ?int $perPage = null): Collection|LengthAwarePaginator
    {
        return $this->bookingRepo->getRoomBookings($roomId, $date, $dateFrom, $dateTo, $perPage);
    }

    public function getAvailabilitySlots(int $roomId, string $date): array
    {
        $open = Carbon::parse($date . ' ' . config('coworking.operating_hours.open', '08:00'));
        $close = Carbon::parse($date . ' ' . config('coworking.operating_hours.close', '18:00'));

        $bookings = Booking::query()
            ->where('room_id', $roomId)
            ->where('start_time', '<', $close)
            ->where('end_time', '>', $open)
            ->orderBy('start_time')
            ->get();

        $slots = [];
        $current = $open->copy();
        $interval = (int) config('coworking.availability_interval', 30);
        $bookingIdx = 0;
        $bookingCount = $bookings->count();

        while ($current < $close) {
            $slotEnd = $current->copy()->addMinutes($interval);

            if ($slotEnd > $close) {
                $slotEnd = $close->copy();
            }

            while ($bookingIdx < $bookingCount && $bookings[$bookingIdx]->end_time <= $current) {
                $bookingIdx++;
            }

            $available = true;
            if ($bookingIdx < $bookingCount) {
                $booking = $bookings[$bookingIdx];
                if ($current < $booking->end_time && $slotEnd > $booking->start_time) {
                    $available = false;
                }
            }

            $slots[] = [
                'start_time' => $current->toIso8601String(),
                'end_time' => $slotEnd->toIso8601String(),
                'available' => $available,
            ];

            $current = $slotEnd;
        }

        return $slots;
    }

    public function getUserBookings(User $user): Collection
    {
        return $this->bookingRepo->findByUser($user->id);
    }
}
