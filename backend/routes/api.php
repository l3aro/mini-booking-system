<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\RoomController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

Route::apiResource('rooms', RoomController::class)->only(['index', 'show']);

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::apiResource('rooms', RoomController::class)->only(['store', 'update', 'destroy']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);
});

Route::get('/rooms/{room}/bookings', [BookingController::class, 'roomBookings']);
Route::get('/rooms/{room}/availability', [BookingController::class, 'availability']);
