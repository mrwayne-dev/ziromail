<?php

namespace App\Models;

use App\Identity\Concerns\HasTwoFactor;
use App\Identity\Services\EmailVerificationCode;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'business_name', 'phone'])]
#[Hidden(['password', 'remember_token', 'two_factor_secret', 'verification_code_hash'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasTwoFactor, Notifiable;

    /** @return HasMany<Domain, $this> */
    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }

    /** @return HasMany<Invoice, $this> */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /** @return HasMany<TeamMember, $this> */
    public function teamMembers(): HasMany
    {
        return $this->hasMany(TeamMember::class, 'owner_id');
    }

    /** @return HasMany<Delegation, $this> */
    public function delegations(): HasMany
    {
        return $this->hasMany(Delegation::class, 'owner_id');
    }

    /** The confirmation email carries a 6-digit code, not a link (see EmailVerificationCode). */
    public function sendEmailVerificationNotification(): void
    {
        app(EmailVerificationCode::class)->issue($this);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_secret' => 'encrypted',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_pending_until' => 'datetime',
            'two_factor_prompt_snoozed_until' => 'datetime',
            'verification_code_expires_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'last_login_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
        ];
    }
}
