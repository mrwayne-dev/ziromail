<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorSetupController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->user()->hasConfirmedTwoFactor()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/TwoFactorSetup', [
            'forced' => (bool) config('identity.two_factor.enforce_for_owners'),
            'endpoints' => ['start' => route('two-factor.enable', absolute: false), 'confirm' => route('two-factor.confirm', absolute: false), 'confirmPassword' => route('password.confirm.store', absolute: false)],
            'next' => route('dashboard'),
        ]);
    }
}
