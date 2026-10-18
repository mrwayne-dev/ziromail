<?php

namespace App\Http\Requests\Identity;

use App\Http\Requests\BaseRequest;
use App\Identity\Rules\PasswordRule;

class ChangePasswordRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', 'current_password:'.auth()->getDefaultDriver()],
            'password' => [...PasswordRule::rules(), 'confirmed', 'different:current_password'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.current_password' => 'That is not your current password.',
            'password.confirmed' => 'The two passwords do not match.',
            'password.different' => 'Choose a password you have not just been using.',
            'password.min' => 'Use at least '.config('identity.password.min').' characters.',
            'password.uncompromised' => 'That password has appeared in a data breach. Choose a different one.',
        ];
    }
}
