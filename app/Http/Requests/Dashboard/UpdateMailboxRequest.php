<?php

namespace App\Http\Requests\Dashboard;

use App\Http\Requests\BaseRequest;

/** Any subset of a mailbox's own settings. Only these keys pass: nothing else can be written. */
class UpdateMailboxRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'display_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'quota_gb' => ['sometimes', 'numeric', 'min:0', 'max:1000'],
            'require_two_factor' => ['sometimes', 'boolean'],
            'require_password_change' => ['sometimes', 'boolean'],
            'forwarding' => ['sometimes', 'array:to,keepCopy'],
            'forwarding.to' => ['nullable', 'email:rfc', 'max:254'],
            'forwarding.keepCopy' => ['boolean'],
            'auto_reply' => ['sometimes', 'array:on,from,until,message'],
            'auto_reply.on' => ['boolean'],
            'auto_reply.from' => ['nullable', 'date'],
            'auto_reply.until' => ['nullable', 'date', 'after_or_equal:auto_reply.from'],
            'auto_reply.message' => ['nullable', 'string', 'max:2000'],
            'filtering' => ['sometimes', 'array:spam,rejectExecutables'],
            'filtering.spam' => ['boolean'],
            'filtering.rejectExecutables' => ['boolean'],
            'limits' => ['sometimes', 'array:hourly,daily'],
            'limits.hourly' => ['integer', 'min:1', 'max:1000'],
            'limits.daily' => ['integer', 'min:1', 'max:10000'],
        ];
    }
}
