<?php

namespace App\Http\Requests\Identity;

use App\Http\Requests\BaseRequest;
use App\Identity\Rules\PasswordRule;

class ResetPasswordRequest extends BaseRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'max:128'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => [...PasswordRule::rules(), 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.min' => 'Use at least '.config('identity.password.min').' characters.',
            'password.confirmed' => 'The two passwords do not match.',
            'password.uncompromised' => 'That password has appeared in a data breach. Choose a different one.',
        ];
    }
}
