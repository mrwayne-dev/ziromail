<?php

namespace App\Http\Requests\Identity;

use App\Http\Requests\BaseRequest;

class ForgotPasswordRequest extends BaseRequest
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
        return ['email' => ['required', 'string', 'email', 'max:255']];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['email.required' => 'Enter the address you sign in with, for example you@yourbusiness.com.', 'email.email' => 'Enter the address you sign in with, for example you@yourbusiness.com.'];
    }
}
