<?php

return [
    'operating_hours' => [
        'open' => env('COWORKING_OPEN', '08:00'),
        'close' => env('COWORKING_CLOSE', '18:00'),
    ],
    'availability_interval' => env('COWORKING_INTERVAL', 30),
];
