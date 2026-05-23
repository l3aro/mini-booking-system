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
use Illuminate\Pagination\LengthAwarePaginator;

class BookingController extends Controller
{
    public function __construct(private BookingService $bookingService) {}

    public function store(StoreBookingRequest $request): BookingResource|JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        try {
            $booking = $this->bookingService->createBooking($data, $request->user());
        } catch (BookingConflictException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 409);
        }

        $booking->load(['room', 'user']);

        return (new BookingResource($booking))
            ->additional([])
            ->response()
            ->setStatusCode(201);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Booking::query()->orderBy('start_time');
        $perPage = min((int) $request->input('per_page', 20), 100);

        if ($request->filled('filter') && $request->filter === 'mine') {
            $query->where('user_id', $request->user()->id);
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

        return BookingResource::collection($query->with(['room', 'user'])->paginate($perPage));
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        $booking = Booking::find($id);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        $user = $request->user();

        if (!$user->is_admin && $booking->user_id !== $user->id) {
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

        $perPage = min((int) $request->input('per_page', 20), 100);
        $bookings = $this->bookingService->getRoomBookings(
            $roomId,
            $request->input('date'),
            $request->input('date_from'),
            $request->input('date_to'),
            $perPage
        );

        if ($bookings instanceof LengthAwarePaginator) {
            $bookings->getCollection()->load(['room', 'user']);

            return BookingResource::collection($bookings);
        }

        $bookings->load(['room', 'user']);

        return BookingResource::collection($bookings);
    }

    public function availability(int $roomId, Request $request): JsonResponse
    {
        $room = Room::find($roomId);

        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        $date = $request->input('date', now()->toDateString());
        $slots = $this->bookingService->getAvailabilitySlots($roomId, $date);

        return response()->json(['data' => $slots]);
    }
}
