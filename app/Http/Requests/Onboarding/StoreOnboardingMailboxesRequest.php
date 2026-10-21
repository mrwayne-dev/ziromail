<?php

namespace App\Http\Requests\Onboarding;

use App\Http\Requests\BaseRequest;

class StoreOnboardingMailboxesRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'domain' => ['required', 'string', 'size:26'],
            'rows' => ['required', 'array', 'min:1', 'max:25'],
            'rows.*.local_part' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/i'],
            'rows.*.quota_gb' => ['required', 'numeric', 'min:0.5', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'rows.*.local_part.regex' => 'Use letters, numbers, dots, dashes or underscores.',
            'rows.*.quota_gb.min' => 'Give every mailbox at least 0.5 GB.',
        ];
    }
}
