<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'capacity'])]
class Room extends Model
{
    public function casts(): array
    {
        return [
            'capacity' => 'integer',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function scopeOrderedByName($query)
    {
        return $query->orderBy('name');
    }
}
