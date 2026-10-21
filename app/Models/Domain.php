<?php

namespace App\Models;

use Database\Factories\DomainFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\QueryException;

class Domain extends Model
{
    /** @use HasFactory<DomainFactory> */
    use HasFactory, HasUlids;

    /** @var list<string> */
    protected $guarded = ['id', 'user_id', 'live_name', 'state', 'verified_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['verified_at' => 'datetime'];
    }

    public function setNameAttribute(string $value): void
    {
        $this->attributes['name'] = mb_strtolower(trim($value));
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasOne<Subscription, $this> */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    /** @return HasMany<DomainRecord, $this> */
    public function records(): HasMany
    {
        return $this->hasMany(DomainRecord::class);
    }

    /** @return HasMany<Mailbox, $this> */
    public function mailboxes(): HasMany
    {
        return $this->hasMany(Mailbox::class);
    }

    /** @return HasMany<Alias, $this> */
    public function aliases(): HasMany
    {
        return $this->hasMany(Alias::class);
    }

    /** Plan pool plus storage bought on top, in GB. */
    public function poolGb(): int
    {
        return (int) ($this->subscription->plan->pool_gb + $this->subscription->extra_storage_gb);
    }

    public function assignedGb(): float
    {
        return round((float) $this->mailboxes->sum('quota_gb'), 1);
    }

    public function usedGb(): float
    {
        return round((float) $this->mailboxes->sum('used_gb'), 1);
    }

    public function unassignedGb(): float
    {
        return round($this->poolGb() - $this->assignedGb(), 1);
    }

    /**
     * Makes this the live holder of its name. The unique `live_name` column means the
     * database refuses a second live owner; the loser is left pending and told nothing.
     */
    public function goLive(): bool
    {
        try {
            $this->forceFill(['live_name' => $this->name, 'state' => 'live', 'verified_at' => now()])->save();

            return true;
        } catch (QueryException $e) {
            if (! str_contains($e->getMessage(), 'domains_live_name_uq')) {
                throw $e;
            }

            return false;
        }
    }
}
