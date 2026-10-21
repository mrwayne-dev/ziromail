<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** How much one mailbox sent in one hour. Counts only; see the migration. */
class SendingStat extends Model
{
    /** @var list<string> */
    protected $guarded = ['id', 'mailbox_id'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['hour' => 'datetime'];
    }

    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class);
    }
}
