<?php

namespace App\Http\Requests\Dashboard;

use App\Http\Requests\BaseRequest;

class StoreDomainRequest extends BaseRequest
{
    /** The one message for every way adding can fail. */
    public const NEUTRAL = "We couldn't add that domain. Check the spelling, or contact support if you think it should be available.";

    /** The pasted address is cleaned the way the browser does: protocol, www and any path dropped. */
    protected function prepareForValidation(): void
    {
        $name = mb_strtolower(trim((string) $this->input('name')));
        $name = preg_replace(['#^[a-z]+://#', '#^www\.#', '#[/?\#].*$#'], '', $name) ?? $name;
        $this->merge(['name' => $name]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:253', 'regex:/^(?!-)(?:[a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,24}$/'],
            'plan' => ['required', 'string', 'exists:plans,code'],
        ];
    }

    /**
     * One message for every way adding can fail. It never says whether the name is taken, held
     * by another account, malformed or yours already, so nothing about our data leaks out.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $message = self::NEUTRAL;

        return ['name.required' => $message, 'name.regex' => $message, 'name.max' => $message, 'plan.exists' => 'Choose one of the plans.'];
    }
}
