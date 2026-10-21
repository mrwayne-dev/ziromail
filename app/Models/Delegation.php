<?php

namespace App\Models;

use Database\Factories\DelegationFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Delegation extends Model
{
    /** @use HasFactory<DelegationFactory> */
    use HasFactory, HasUlids;

    /** @var list<string> */
    protected $guarded = ['id', 'owner_id', 'revoked_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['expires_at' => 'date', 'revoked_at' => 'datetime'];
    }
}
