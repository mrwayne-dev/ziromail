<?php

namespace App\Http\Requests\Dashboard;

use App\Http\Requests\BaseRequest;

class StoreMailboxRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'domain' => ['required', 'string', 'size:26'],
            'local_part' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/i'],
            'display_name' => ['nullable', 'string', 'max:120'],
            'quota_gb' => ['required', 'numeric', 'min:0.5', 'max:1000'],
            'password_mode' => ['required', 'in:link,set'],
            'first_password' => ['required_if:password_mode,set', 'nullable', 'string', 'min:12', 'max:128'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'local_part.regex' => 'Use letters, numbers, dots, dashes or underscores.',
            'quota_gb.min' => 'Give the mailbox at least 0.5 GB.',
            'first_password.required_if' => 'Type the first password, or choose to send a setup link.',
            'first_password.min' => 'Use at least 12 characters.',
        ];
    }
}
