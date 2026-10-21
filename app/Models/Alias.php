<?php

namespace App\Models;

use Database\Factories\AliasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alias extends Model
{
    /** @use HasFactory<AliasFactory> */
    use HasFactory, HasUlids;

    /** @var list<string> */
    protected $guarded = ['id', 'domain_id'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['destinations' => 'array'];
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
}
