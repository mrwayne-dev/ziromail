<?php

namespace App\Http\Requests\Api;

use App\Http\Requests\BaseRequest;

class MailEventsRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'sending' => ['sometimes', 'array', 'max:1000'],
            'sending.*.mailbox' => ['required', 'string', 'max:320'],
            'sending.*.hour' => ['required', 'date'],
            'sending.*.sent' => ['required', 'integer', 'min:0', 'max:10000000'],
            'sending.*.bounced' => ['required', 'integer', 'min:0', 'max:10000000'],
            'sending.*.complaints' => ['required', 'integer', 'min:0', 'max:10000000'],
            'sending.*.new_recipients' => ['sometimes', 'integer', 'min:0', 'max:10000000'],
            'sending.*.filter_flagged' => ['sometimes', 'integer', 'min:0', 'max:10000000'],
            'delivery' => ['sometimes', 'array', 'max:1000'],
            'delivery.*.domain' => ['required', 'string', 'max:253'],
            'delivery.*.recipient_domain' => ['required', 'string', 'max:253'],
            'delivery.*.hour' => ['required', 'date'],
            'delivery.*.delivered' => ['required', 'integer', 'min:0', 'max:10000000'],
            'delivery.*.deferred' => ['required', 'integer', 'min:0', 'max:10000000'],
            'delivery.*.bounced' => ['required', 'integer', 'min:0', 'max:10000000'],
            'delivery.*.rejected' => ['required', 'integer', 'min:0', 'max:10000000'],
            'delivery.*.reply_code' => ['nullable', 'string', 'max:12', 'regex:/^[0-9][0-9. ]*$/'],
        ];
    }
}
