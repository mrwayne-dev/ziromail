<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class BaseRequest extends FormRequest
{
    /**
     * API and other non-Inertia requests get a JSON error response. An Inertia
     * request falls through to the framework's redirect-with-errors, which is
     * what Inertia's form helper reads.
     */
    protected function failedValidation(Validator $validator): never
    {
        if ($this->header('X-Inertia')) {
            parent::failedValidation($validator);
        }

        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422)
        );
    }

    public function authorize(): bool
    {
        return true;
    }
}
