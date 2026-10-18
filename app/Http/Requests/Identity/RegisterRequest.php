<?php

namespace App\Http\Requests\Identity;

use App\Http\Requests\BaseRequest;
use App\Identity\Rules\PasswordRule;

class RegisterRequest extends BaseRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
    }

    /**
     * No `unique` rule on purpose: an address that is already registered must
     * look exactly like a new one (docs/DASHBOARD_BUILD.md 7.7).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'business' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^[0-9+()\s-]{10,20}$/'],
            'password' => PasswordRule::rules(),
            'terms' => ['accepted'],
            'plan' => ['nullable', 'string', 'max:32'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'business.required' => 'Tell us the name of your business.',
            'email.required' => 'Enter the address we should send your setup link to.',
            'email.email' => 'That does not look like an email address. Check for a missing @ or ending.',
            'phone.required' => 'Enter a WhatsApp number with at least ten digits.',
            'phone.regex' => 'Enter a WhatsApp number with at least ten digits.',
            'password.min' => 'Use at least '.config('identity.password.min').' characters.',
            'password.uncompromised' => 'That password has appeared in a data breach. Choose a different one.',
            'terms.accepted' => 'Tick the box to agree before creating your account.',
        ];
    }
}
