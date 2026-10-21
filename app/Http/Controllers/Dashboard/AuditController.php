<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityItemResource;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\AuditLog;
use App\Services\AccountContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditController extends Controller
{
    private const CATEGORIES = ['mailboxes', 'storage', 'billing', 'access', 'domain'];

    private const RETENTION_MONTHS = 12;

    public function index(Request $request, AccountContext $account): Response
    {
        $filter = in_array($request->query('filter'), self::CATEGORIES, true) ? $request->query('filter') : 'all';
        $entries = $this->query($account, $filter)->limit(50)->get();

        return Inertia::render('Dashboard/Audit', [
            'filter' => $filter,
            'entries' => ActivityItemResource::collection($entries)->resolve(),
            'retentionMonths' => self::RETENTION_MONTHS,
        ]);
    }

    /** The filtered log as a CSV file. The export is itself written to the log. */
    public function export(Request $request, AccountContext $account, AuditLogger $audit): StreamedResponse
    {
        $filter = in_array($request->query('filter'), self::CATEGORIES, true) ? $request->query('filter') : 'all';
        $audit->account(AuditAction::LogExported, $account->owner(), 'access', 'You downloaded the activity log', $request->user());

        return response()->streamDownload(function () use ($account, $filter) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['When (UTC)', 'Category', 'What', 'Detail']);
            $this->query($account, $filter)->limit(5000)->each(function (AuditLog $row) use ($out) {
                // Cells starting with = + - @ are prefixed so a spreadsheet never runs them as a formula.
                $safe = fn (?string $v) => $v !== null && preg_match('/^[=+\-@\t\r]/', $v) ? "'".$v : $v;
                fputcsv($out, [$row->created_at->toIso8601String(), $row->category, $safe(str_replace('*', '', (string) $row->summary)), $safe($row->detail)]);
            });
            fclose($out);
        }, 'activity-log.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** @return Builder<AuditLog> */
    private function query(AccountContext $account, string $filter)
    {
        return AuditLog::query()
            ->where('account_id', $account->owner()->getKey())
            ->whereNotNull('summary')
            ->where('created_at', '>=', now()->subMonths(self::RETENTION_MONTHS))
            ->when($filter !== 'all', fn ($q) => $q->where('category', $filter))
            ->latest('id');
    }
}
