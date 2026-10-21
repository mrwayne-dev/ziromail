<?php

namespace App\Models;

use Database\Factories\DomainRecordFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DomainRecord extends Model
{
    /** @use HasFactory<DomainRecordFactory> */
    use HasFactory, HasUlids;

    /** @var list<string> */
    protected $guarded = ['id'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['expected' => 'array', 'observed' => 'array', 'last_checked_at' => 'datetime', 'broken_since' => 'datetime'];
    }

    /** @return BelongsTo<Domain, $this> */
    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }
}
