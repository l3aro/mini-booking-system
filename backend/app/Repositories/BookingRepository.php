<?php

namespace App\Repositories;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
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
        return Booking::query()
            ->where('user_id', $userId)
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

    public function getRoomBookings(int $roomId, ?string $date, ?string $dateFrom, ?string $dateTo, ?int $perPage = null): Collection|LengthAwarePaginator
    {
        $query = Booking::query()
            ->where('room_id', $roomId)
            ->orderBy('start_time');

        if ($dateFrom && $dateTo) {
            $query->whereBetween('start_time', [
                Carbon::parse($dateFrom),
                Carbon::parse($dateTo),
            ]);
        } elseif ($date) {
            $query->whereDate('start_time', $date);
        }

        if ($perPage !== null) {
            return $query->paginate($perPage);
        }

        return $query->get();
    }

    public function delete(int $id): bool
    {
        $booking = Booking::find($id);

        return $booking ? (bool) $booking->delete() : false;
    }
}
