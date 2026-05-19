<?php

namespace App\Repositories;

use App\Models\Booking;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class BookingRepository
{
    public function findOverlapping(int $roomId, Carbon $start, Carbon $end, ?int $excludeId = null): Collection
    {
        return Booking::query()
            ->where('room_id', $roomId)
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start)
            ->when($excludeId, fn ($query) => $query->where('id', '!=', $excludeId))
            ->get();
    }

    public function create(array $data): Booking
    {
        return Booking::create($data);
    }

    public function findById(int $id): ?Booking
    {
        return Booking::find($id);
    }

    public function findByUser(int $userId): Collection
    {
        $userName = User::query()->whereKey($userId)->value('name');

        if (! $userName) {
            return new Collection;
        }

        return Booking::query()
            ->where('user_name', $userName)
            ->orderBy('start_time')
            ->get();
    }

    public function findByRoomAndDate(int $roomId, string $date): Collection
    {
        return Booking::query()
            ->where('room_id', $roomId)
            ->whereDate('start_time', $date)
            ->orderBy('start_time')
            ->get();
    }

    public function delete(int $id): bool
    {
        $booking = Booking::find($id);

        return $booking ? (bool) $booking->delete() : false;
    }
}
