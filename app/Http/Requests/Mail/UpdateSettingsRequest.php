<?php

namespace App\Http\Requests\Mail;

use App\Http\Requests\BaseRequest;

/**
 * The subset of mailbox settings the mailbox owner edits from the webmail
 * Settings page. Only these keys pass: nothing else can be written, which keeps
 * fields that belong on the ops console (quota, require_two_factor, abuse state)
 * out of this endpoint's reach.
 *
 * Mail-app devices and the read/write preferences are not here on purpose — they
 * are shown with an honest banner on the page and are waiting on the mail-server
 * decision; see docs/BUILD_LOG.md 2026-10-23.
 */
class UpdateSettingsRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'display_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'reply_to' => ['sometimes', 'nullable', 'email:rfc', 'max:254'],
            'signature_text' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'signature_on_replies' => ['sometimes', 'boolean'],
            'block_remote_images' => ['sometimes', 'boolean'],
            'auto_reply' => ['sometimes', 'array:on,from,until'],
            'auto_reply.on' => ['boolean'],
            'auto_reply.from' => ['nullable', 'date'],
            'auto_reply.until' => ['nullable', 'date', 'after_or_equal:auto_reply.from'],
        ];
    }
}
