<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        Room::create(['name' => 'Workspace A', 'capacity' => 4]);
        Room::create(['name' => 'Private Office', 'capacity' => 2]);
        Room::create(['name' => 'Meeting Room', 'capacity' => 8]);
        Room::create(['name' => 'Creative Lab', 'capacity' => 6]);
    }
}
