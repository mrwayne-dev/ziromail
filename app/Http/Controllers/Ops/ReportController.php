<?php

namespace App\Http\Controllers\Ops;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use App\Models\Invoice;
use App\Models\Mailbox;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Month-by-month growth and billing, counted from our tables. Uptime, support and
 * departure reasons are not recorded anywhere yet, so they are not shown.
 */
class ReportController extends Controller
{
    public function __invoke(): Response
    {
        $months = collect(range(5, 0))->map(fn (int $ago) => now()->startOfMonth()->subMonths($ago));

        return Inertia::render('Ops/Reports', [
            'month' => now()->format('F Y'),
            'headline' => [
                'newUsers' => User::query()->where('created_at', '>=', now()->startOfMonth())->count(),
                'newUsersLast' => User::query()->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->startOfMonth()])->count(),
                'billedMinor' => (int) Invoice::query()->where('status', 'paid')->where('issued_at', '>=', now()->startOfMonth())->sum('total'),
                'newDomains' => Domain::query()->where('created_at', '>=', now()->startOfMonth())->count(),
                'newMailboxes' => Mailbox::query()->where('created_at', '>=', now()->startOfMonth())->count(),
                'assignedGb' => round((float) Mailbox::query()->sum('quota_gb'), 1),
            ],
            'usersByMonth' => $months->map(fn ($start) => [
                'label' => $start->format('M'),
                'total' => User::query()->where('created_at', '<', $start->copy()->addMonth())->count(),
            ])->values(),
            'billing' => [
                'paidMinor' => (int) Invoice::query()->where('status', 'paid')->sum('total'),
                'invoices' => Invoice::query()->count(),
                'overdue' => Invoice::query()->where('status', '!=', 'paid')->count(),
            ],
            'earlier' => $months->take(5)->map(fn ($start) => [
                'month' => $start->format('F Y'),
                'users' => User::query()->where('created_at', '<', $start->copy()->addMonth())->count(),
                'billedMinor' => (int) Invoice::query()->where('status', 'paid')->whereBetween('issued_at', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()])->sum('total'),
            ])->reverse()->values(),
        ]);
    }
}
