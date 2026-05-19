<?php

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['is_admin' => true, 'name' => 'Admin']);
    $this->user = User::factory()->create(['is_admin' => false, 'name' => 'John']);
    $this->otherUser = User::factory()->create(['is_admin' => false, 'name' => 'Jane']);
    $this->userToken = $this->user->createToken('auth-token')->plainTextToken;
    $this->adminToken = $this->admin->createToken('auth-token')->plainTextToken;
    $this->otherToken = $this->otherUser->createToken('auth-token')->plainTextToken;
    $this->room = Room::create(['name' => 'Room A', 'capacity' => 4]);
});

it('requires authentication to create booking', function () {
    $response = $this->postJson('/api/bookings', [
        'room_id' => $this->room->id,
        'start_time' => '2026-06-01T09:00:00Z',
        'end_time' => '2026-06-01T10:00:00Z',
    ]);

    $response->assertStatus(401);
});

it('authenticated user can create booking', function () {
    $response = $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T09:00:00Z',
            'end_time' => '2026-06-01T10:00:00Z',
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => [
                'id', 'room_id', 'user_name', 'start_time', 'end_time', 'room',
            ],
        ]);
});

it('rejects overlapping booking', function () {
    $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T09:00:00Z',
            'end_time' => '2026-06-01T10:00:00Z',
        ])->assertStatus(201);

    $response = $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T09:30:00Z',
            'end_time' => '2026-06-01T10:30:00Z',
        ]);

    $response->assertStatus(409)
        ->assertJson(['message' => 'Room already booked for selected time slot.']);
});

it('allows boundary adjacent booking (end==start)', function () {
    $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T09:00:00Z',
            'end_time' => '2026-06-01T10:00:00Z',
        ])->assertStatus(201);

    $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T10:00:00Z',
            'end_time' => '2026-06-01T11:00:00Z',
        ])->assertStatus(201);
});

it('validates booking start_time before end_time', function () {
    $response = $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T10:00:00Z',
            'end_time' => '2026-06-01T09:00:00Z',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['end_time']);
});

it('validates room_id exists', function () {
    $response = $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => 999,
            'start_time' => '2026-06-01T09:00:00Z',
            'end_time' => '2026-06-01T10:00:00Z',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['room_id']);
});

it('can list bookings', function () {
    $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T09:00:00Z',
            'end_time' => '2026-06-01T10:00:00Z',
        ])->assertStatus(201);

    $response = $this->withToken($this->userToken)
        ->getJson('/api/bookings');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('can filter bookings by mine', function () {
    // Create booking as John via API
    $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T09:00:00Z',
            'end_time' => '2026-06-01T10:00:00Z',
        ])->assertStatus(201);

    // Create booking as Jane via direct DB (avoid token switching)
    Booking::create([
        'room_id' => $this->room->id,
        'user_name' => 'Jane',
        'start_time' => '2026-06-01T10:00:00Z',
        'end_time' => '2026-06-01T11:00:00Z',
    ]);

    $response = $this->withToken($this->userToken)
        ->getJson('/api/bookings?filter=mine');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJson([
            'data' => [
                ['user_name' => 'John'],
            ],
        ]);
});

it('can filter bookings by date', function () {
    $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T09:00:00Z',
            'end_time' => '2026-06-01T10:00:00Z',
        ])->assertStatus(201);

    $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-02T09:00:00Z',
            'end_time' => '2026-06-02T10:00:00Z',
        ])->assertStatus(201);

    $response = $this->withToken($this->userToken)
        ->getJson('/api/bookings?date=2026-06-01');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('can list room bookings', function () {
    $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T09:00:00Z',
            'end_time' => '2026-06-01T10:00:00Z',
        ])->assertStatus(201);

    $response = $this->getJson('/api/rooms/' . $this->room->id . '/bookings');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

it('can get availability slots', function () {
    $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T09:00:00Z',
            'end_time' => '2026-06-01T10:00:00Z',
        ])->assertStatus(201);

    $response = $this->getJson('/api/rooms/' . $this->room->id . '/availability?date=2026-06-01');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['start_time', 'end_time', 'available'],
            ],
        ]);
});

it('admin can delete any booking', function () {
    $this->withToken($this->userToken)
        ->postJson('/api/bookings', [
            'room_id' => $this->room->id,
            'start_time' => '2026-06-01T09:00:00Z',
            'end_time' => '2026-06-01T10:00:00Z',
        ])->assertStatus(201);

    $booking = Booking::first();

    $response = $this->withToken($this->adminToken)
        ->deleteJson('/api/bookings/' . $booking->id);

    $response->assertStatus(204);
});

it('non-admin cannot delete others booking', function () {
    // Create booking directly (avoid Sanctum guard caching across requests)
    $booking = Booking::create([
        'room_id' => $this->room->id,
        'user_name' => 'John',
        'start_time' => '2026-06-01T09:00:00Z',
        'end_time' => '2026-06-01T10:00:00Z',
    ]);

    // Try to delete as Jane - should be forbidden
    $response = $this->withToken($this->otherToken)
        ->deleteJson('/api/bookings/' . $booking->id);

    $response->assertStatus(403);
});

it('returns 404 when deleting non-existent booking', function () {
    $response = $this->withToken($this->adminToken)
        ->deleteJson('/api/bookings/999');

    $response->assertStatus(404);
});

it('concurrent_booking_race_handled', function () {
    $service = app(BookingService::class);

    $payload = [
        'room_id' => $this->room->id,
        'start_time' => '2026-06-03T09:00:00Z',
        'end_time' => '2026-06-03T10:00:00Z',
    ];

    DB::transaction(function () use ($service, $payload) {
        $service->createBooking($payload, $this->user);

        expect(fn () => $service->createBooking($payload, $this->otherUser))
            ->toThrow(\App\Exceptions\BookingConflictException::class);
    });

    expect(Booking::query()->where('room_id', $this->room->id)->count())->toBe(1);
});
