<?php

namespace App\Models;

use Database\Factories\AbuseFlagFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A mailbox the sending bot found unlike itself. Evidence is numbers; a person decides what to do. */
class AbuseFlag extends Model
{
    /** @use HasFactory<AbuseFlagFactory> */
    use HasFactory, HasUlids;

    /** @var list<string> */
    protected $guarded = ['id', 'mailbox_id', 'status', 'outcome', 'resolved_by', 'resolved_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['rules' => 'array', 'evidence' => 'array', 'resolved_at' => 'datetime'];
    }

    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class)->withTrashed();
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'resolved_by');
    }
}
