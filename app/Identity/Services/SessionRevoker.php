<?php

namespace App\Identity\Services;

use App\Models\Staff;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Ends sessions by deleting their rows from the database session store. Users
 * and staff have separate tables, so one can never end the other's sessions.
 */
class SessionRevoker
{
    public function tableFor(Model $account): string
    {
        return $account instanceof Staff ? 'staff_sessions' : 'sessions';
    }

    /** Ends every session for the account, optionally keeping one. Returns how many ended. */
    public function endAll(Model $account, ?string $exceptSessionId = null): int
    {
        return DB::table($this->tableFor($account))
            ->where('user_id', $account->getKey())
            ->when($exceptSessionId, fn ($query) => $query->where('id', '!=', $exceptSessionId))
            ->delete();
    }

    public function endOne(Model $account, string $sessionId): int
    {
        return DB::table($this->tableFor($account))
            ->where('user_id', $account->getKey())
            ->where('id', $sessionId)
            ->delete();
    }
}
