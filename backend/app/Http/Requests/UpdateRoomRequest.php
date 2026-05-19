<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, string>
     */
    public function rules(): array
    {
        $roomId = $this->route('room');

        return [
            'name' => ['sometimes', 'string', 'max:255', "unique:rooms,name,{$roomId}"],
            'capacity' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
