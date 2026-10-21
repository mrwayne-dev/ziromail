<?php

namespace App\Http\Requests\Dashboard;

use App\Http\Requests\BaseRequest;

class InviteTeamMemberRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return ['email' => ['required', 'email:rfc', 'max:254']];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['email.required' => 'Enter a full email address, like name@example.com.', 'email.email' => 'Enter a full email address, like name@example.com.'];
    }
}
