<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Http\Resources\RoomResource;
use App\Models\Room;
use Illuminate\Http\JsonResponse;

class RoomController extends Controller
{
    public function index()
    {
        $rooms = Room::orderedByName()->get();

        return RoomResource::collection($rooms);
    }

    public function show($id): RoomResource
    {
        $room = Room::findOrFail($id);

        return new RoomResource($room);
    }

    public function store(StoreRoomRequest $request): RoomResource
    {
        $room = Room::create($request->validated());

        return new RoomResource($room);
    }

    public function update(UpdateRoomRequest $request, $id): RoomResource
    {
        $room = Room::findOrFail($id);
        $room->update($request->validated());

        return new RoomResource($room);
    }

    public function destroy($id): JsonResponse
    {
        $room = Room::findOrFail($id);
        $room->delete();

        return response()->json(null, 204);
    }
}
