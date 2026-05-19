<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $workspaceA = Room::where('name', 'Workspace A')->first();
        $meetingRoom = Room::where('name', 'Meeting Room')->first();
        $privateOffice = Room::where('name', 'Private Office')->first();

        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        Booking::create([
            'room_id' => $workspaceA->id,
            'user_name' => 'John Doe',
            'start_time' => $today->copy()->setHour(9)->setMinute(0),
            'end_time' => $today->copy()->setHour(11)->setMinute(0),
        ]);

        Booking::create([
            'room_id' => $meetingRoom->id,
            'user_name' => 'Jane Smith',
            'start_time' => $today->copy()->setHour(14)->setMinute(0),
            'end_time' => $today->copy()->setHour(16)->setMinute(0),
        ]);

        Booking::create([
            'room_id' => $workspaceA->id,
            'user_name' => 'Jane Smith',
            'start_time' => $tomorrow->copy()->setHour(10)->setMinute(0),
            'end_time' => $tomorrow->copy()->setHour(12)->setMinute(0),
        ]);

        Booking::create([
            'room_id' => $privateOffice->id,
            'user_name' => 'John Doe',
            'start_time' => $tomorrow->copy()->setHour(13)->setMinute(0),
            'end_time' => $tomorrow->copy()->setHour(15)->setMinute(0),
        ]);
    }
}
