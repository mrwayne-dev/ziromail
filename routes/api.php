<?php

use App\Http\Controllers\Api\MailEventsController;
use App\Http\Middleware\VerifyMailServerSignature;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['success' => true, 'status' => 'ok', 'service' => config('app.name')]);
});

// The mail server's hourly count reports: signed, rate limited, no session.
Route::post('/mail-events', MailEventsController::class)->middleware(['throttle:60,1', VerifyMailServerSignature::class]);
