<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['success' => true, 'status' => 'ok', 'service' => config('app.name')]);
});
