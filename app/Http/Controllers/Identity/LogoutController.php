<?php

namespace App\Http\Controllers\Identity;

use App\Http\Controllers\Controller;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutController extends Controller
{
    public function destroy(Request $request, AuditLogger $audit): RedirectResponse
    {
        $user = $request->user();
        $audit->record(AuditAction::Logout, $user);

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
