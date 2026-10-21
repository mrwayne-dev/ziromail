<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Inertia\Inertia;
use Inertia\Response;

/** The roster of operations accounts. Accounts are made with `php artisan staff:create`, never through a form. */
class StaffController extends Controller
{
    private const PERMISSIONS = [
        'support' => ['Read accounts', 'Re-check DNS', 'Request refunds'],
        'engineer' => ['Read accounts', 'Re-check DNS', 'Request refunds', 'Lock and unlock', 'Restore backups'],
        'owner' => ['All accounts', 'Lock and unlock', 'Approve refunds', 'Restore backups', 'Change staff access'],
    ];

    public function __invoke(): Response
    {
        return Inertia::render('Ops/Staff', [
            'people' => Staff::query()->orderBy('name')->get()->map(fn (Staff $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'email' => $s->email,
                'role' => $s->role,
                'perms' => self::PERMISSIONS[$s->role] ?? [],
                'twoFactorEnabled' => $s->hasConfirmedTwoFactor(),
                'lastSignInAt' => $s->last_login_at?->toIso8601String(),
                'disabled' => $s->disabled_at !== null,
            ])->values(),
            'owners' => Staff::query()->where('role', 'owner')->whereNull('disabled_at')->count(),
        ]);
    }
}
