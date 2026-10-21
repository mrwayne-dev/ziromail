<?php

namespace App\Models;

use Database\Factories\MailboxFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A mailbox's size and state. It never holds, and no column can hold, message content.
 */
class Mailbox extends Model
{
    /** @use HasFactory<MailboxFactory> */
    use HasFactory, HasUlids, SoftDeletes;

    /** @var list<string> */
    protected $guarded = ['id', 'domain_id', 'provisioning_state', 'used_gb', 'last_login_at', 'setup_completed_at', 'deleted_at', 'sending_state', 'abuse_exempt_reason'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quota_gb' => 'float',
            'used_gb' => 'float',
            'require_two_factor' => 'boolean',
            'require_password_change' => 'boolean',
            'settings' => 'array',
            'last_login_at' => 'datetime',
            'setup_completed_at' => 'datetime',
        ];
    }

    /** Where sending sits when nothing is wrong: full speed once the domain has paid, a low cap before that. */
    public function restingSendingState(): string
    {
        return $this->domain->subscription?->status === 'active' ? 'normal' : 'probation';
    }

    public function setLocalPartAttribute(string $value): void
    {
        $this->attributes['local_part'] = mb_strtolower(trim($value));
    }

    /** @return BelongsTo<Domain, $this> */
    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    /** @return Attribute<string, never> */
    protected function address(): Attribute
    {
        return Attribute::get(fn () => $this->local_part.'@'.$this->domain->name);
    }
}
