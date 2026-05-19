<?php

use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['is_admin' => true]);
    $this->user = User::factory()->create(['is_admin' => false]);
    $this->adminToken = $this->admin->createToken('auth-token')->plainTextToken;
    $this->userToken = $this->user->createToken('auth-token')->plainTextToken;
});

it('can list rooms publicly', function () {
    Room::create(['name' => 'Room A', 'capacity' => 4]);
    Room::create(['name' => 'Room B', 'capacity' => 8]);

    $response = $this->getJson('/api/rooms');

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data');
});

it('can view single room', function () {
    $room = Room::create(['name' => 'Room A', 'capacity' => 4]);

    $response = $this->getJson('/api/rooms/' . $room->id);

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $room->id,
                'name' => 'Room A',
                'capacity' => 4,
            ],
        ]);
});

it('returns 404 for non-existent room', function () {
    $response = $this->getJson('/api/rooms/999');

    $response->assertStatus(404);
});

it('admin can create a room', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
        ->postJson('/api/rooms', [
            'name' => 'New Room',
            'capacity' => 10,
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'data' => [
                'name' => 'New Room',
                'capacity' => 10,
            ],
        ]);

    $this->assertDatabaseHas('rooms', ['name' => 'New Room']);
});

it('non-admin cannot create a room', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->userToken)
        ->postJson('/api/rooms', [
            'name' => 'New Room',
            'capacity' => 10,
        ]);

    $response->assertStatus(403);
});

it('admin can update a room', function () {
    $room = Room::create(['name' => 'Old Name', 'capacity' => 4]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
        ->putJson('/api/rooms/' . $room->id, [
            'name' => 'Updated Name',
            'capacity' => 6,
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $room->id,
                'name' => 'Updated Name',
                'capacity' => 6,
            ],
        ]);
});

it('admin can delete a room', function () {
    $room = Room::create(['name' => 'To Delete', 'capacity' => 2]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
        ->deleteJson('/api/rooms/' . $room->id);

    $response->assertStatus(204);
    $this->assertDatabaseMissing('rooms', ['id' => $room->id]);
});

it('validates room creation data', function () {
    $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
        ->postJson('/api/rooms', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'capacity']);
});
