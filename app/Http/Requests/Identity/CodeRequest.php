<?php

namespace App\Http\Requests\Identity;

use App\Http\Requests\BaseRequest;

/** A single code field: a six-digit authenticator code or a recovery code. */
class CodeRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return ['code' => ['required', 'string', 'max:32']];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['code.required' => 'Enter the code.'];
    }
}
