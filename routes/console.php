<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Expired password-reset tokens are useless; remove them daily.
Schedule::command('auth:clear-resets')->daily();

// The sending bot: counts only, every five minutes. Flags wait for a person; clear-cut cases are locked and audited.
Schedule::command('abuse:evaluate')->everyFiveMinutes()->withoutOverlapping();
