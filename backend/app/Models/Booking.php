<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['room_id', 'user_id', 'start_time', 'end_time'])]
class Booking extends Model
{
    public function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForRoom($query, int $roomId)
    {
        return $query->where('room_id', $roomId);
    }

    public function scopeForDate($query, mixed $date)
    {
        return $query->whereDate('start_time', $date);
    }

    public static function overlaps(Room $room, Carbon $start, Carbon $end, ?int $excludeId = null): bool
    {
        $query = static::where('room_id', $room->id)
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }
}
