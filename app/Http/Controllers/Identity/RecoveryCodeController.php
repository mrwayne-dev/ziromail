<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Identity\Services\TwoFactorManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Regenerating is the only way to "see" recovery codes again: it invalidates every
 * old unused code and returns the new set once. There is no route that reads codes.
 */
class RecoveryCodeController extends Controller
{
    public function store(Request $request, TwoFactorManager $twoFactor): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasConfirmedTwoFactor()) {
            return response()->json(['message' => 'Turn on two-factor first.'], 409)->header('Cache-Control', 'no-store, private');
        }

        $codes = $twoFactor->regenerate($user);

        return response()->json(['recoveryCodes' => $codes, 'unused' => count($codes), 'total' => count($codes)])->header('Cache-Control', 'no-store, private');
    }
}
