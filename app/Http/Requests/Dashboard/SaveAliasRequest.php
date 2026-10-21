<?php

namespace App\Http\Requests\Dashboard;

use App\Http\Requests\BaseRequest;

class SaveAliasRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'domain' => ['required', 'string', 'size:26'],
            'local_part' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/i'],
            'destinations' => ['required', 'array', 'min:1', 'max:20'],
            'destinations.*' => ['required', 'string', 'max:64'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'local_part.regex' => 'Use letters, numbers, dots, dashes or underscores.',
            'destinations.required' => 'Choose at least one mailbox to deliver to.',
            'destinations.min' => 'Choose at least one mailbox to deliver to.',
        ];
    }
}
