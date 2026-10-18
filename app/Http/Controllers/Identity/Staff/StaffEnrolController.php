<?php

namespace App\Http\Controllers\Identity\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffEnrolController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->user('staff')->hasConfirmedTwoFactor()) {
            return redirect('/ops');
        }

        return Inertia::render('Auth/TwoFactorSetup', [
            'forced' => true,
            'endpoints' => ['start' => '/ops/security/two-factor', 'confirm' => '/ops/security/two-factor/confirm', 'confirmPassword' => '/ops/confirm-password'],
            'next' => '/ops',
        ]);
    }
}
