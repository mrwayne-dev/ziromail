<?php

namespace App\Http\Requests\Identity;

use App\Http\Requests\BaseRequest;

class ConfirmPasswordRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return ['password' => ['required', 'string', 'max:'.config('identity.password.max')]];
    }
}
