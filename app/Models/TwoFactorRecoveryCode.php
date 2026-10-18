<?php

namespace App\Models;

use Database\Factories\TwoFactorRecoveryCodeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * One recovery code, stored only as a keyed hash. Single use: used_at is set the
 * moment a code is accepted.
 */
#[Fillable(['code_hash'])]
class TwoFactorRecoveryCode extends Model
{
    /** @use HasFactory<TwoFactorRecoveryCodeFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['used_at' => 'datetime', 'created_at' => 'datetime'];
    }

    public function authenticatable(): MorphTo
    {
        return $this->morphTo();
    }
}
