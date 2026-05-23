<?php

namespace App\Http\Controllers;

use App\Exceptions\BookingConflictException;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Room;
use App\Services\BookingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BookingController extends Controller
{
    public function __construct(private BookingService $bookingService) {}

    public function store(StoreBookingRequest $request): BookingResource|JsonResponse
    {
        $data = $request->validated();
        $data['user_name'] = $request->user()->name;

        try {
            $booking = $this->bookingService->createBooking($data, $request->user());
        } catch (BookingConflictException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 409);
        }

        $booking->load('room');

        return (new BookingResource($booking))
            ->additional([])
            ->response()
            ->setStatusCode(201);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Booking::query()->orderBy('start_time');

        if ($request->filled('filter') && $request->filter === 'mine') {
            $query->where('user_name', $request->user()->name);
        }

        if ($request->filled('room_id')) {
            $query->where('room_id', $request->room_id);
        }

        // date=YYYY-MM-DD (legacy, UTC-based whereDate)
        // OR date_from + date_to (UTC ISO strings, browser-computed range)
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('start_time', [
                Carbon::parse($request->date_from),
                Carbon::parse($request->date_to),
            ]);
        } elseif ($request->filled('date')) {
            $query->whereDate('start_time', $request->date);
        }

        return BookingResource::collection($query->with('room')->get());
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        $booking = Booking::find($id);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        $user = $request->user();

        if (!$user->is_admin && $booking->user_name !== $user->name) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $booking->delete();

        return response()->json(null, 204);
    }

    public function roomBookings(int $roomId, Request $request): AnonymousResourceCollection
    {
        $room = Room::find($roomId);

        if (!$room) {
            abort(404, 'Room not found');
        }

        $query = Booking::where('room_id', $roomId)->orderBy('start_time');

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('start_time', [
                Carbon::parse($request->date_from),
                Carbon::parse($request->date_to),
            ]);
        } elseif ($request->filled('date')) {
            $query->whereDate('start_time', $request->date);
        }

        return BookingResource::collection($query->with('room')->get());
    }

    public function availability(int $roomId, Request $request): JsonResponse
    {
        $room = Room::find($roomId);

        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        $date = $request->input('date', now()->toDateString());
        $open = Carbon::parse($date . ' ' . config('coworking.operating_hours.open', '08:00'));
        $close = Carbon::parse($date . ' ' . config('coworking.operating_hours.close', '18:00'));

        $bookings = Booking::where('room_id', $roomId)
            ->where('start_time', '<', $close)
            ->where('end_time', '>', $open)
            ->orderBy('start_time')
            ->get();

        $slots = [];
        $current = $open->copy();
        $interval = 30;

        while ($current < $close) {
            $slotEnd = $current->copy()->addMinutes($interval);

            if ($slotEnd > $close) {
                $slotEnd = $close->copy();
            }

            $available = true;
            foreach ($bookings as $booking) {
                if ($current < $booking->end_time && $slotEnd > $booking->start_time) {
                    $available = false;
                    break;
                }
            }

            $slots[] = [
                'start_time' => $current->toIso8601String(),
                'end_time' => $slotEnd->toIso8601String(),
                'available' => $available,
            ];

            $current = $slotEnd;
        }

        return response()->json(['data' => $slots]);
    }
}
