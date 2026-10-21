<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Outcome counts for one customer domain mailing one recipient provider in one hour. */
class DeliveryStat extends Model
{
    /** @var list<string> */
    protected $guarded = ['id', 'domain_id'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['hour' => 'datetime'];
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }
}
