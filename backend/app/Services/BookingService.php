<?php

namespace App\Services;

use App\Exceptions\BookingConflictException;
use App\Models\Booking;
use App\Models\User;
use App\Repositories\BookingRepository;
use Carbon\Carbon;
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
            $data['user_name'] = $data['user_name'] ?? $user->name;

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

        if (! $user->is_admin && $booking->user_name !== $user->name) {
            return false;
        }

        return $this->bookingRepo->delete($id);
    }

    public function getRoomAvailability(int $roomId, string $date): Collection
    {
        return $this->bookingRepo->findByRoomAndDate($roomId, $date);
    }

    public function getUserBookings(User $user): Collection
    {
        return $this->bookingRepo->findByUser($user->id);
    }
}
