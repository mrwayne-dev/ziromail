<?php

use App\Http\Controllers\Identity\ConfirmPasswordController;
use App\Http\Controllers\Identity\LoginController;
use App\Http\Controllers\Identity\LogoutController;
use App\Http\Controllers\Identity\PasswordController;
use App\Http\Controllers\Identity\PasswordResetController;
use App\Http\Controllers\Identity\RecoveryCodeController;
use App\Http\Controllers\Identity\RegisterController;
use App\Http\Controllers\Identity\SessionController;
use App\Http\Controllers\Identity\Staff\StaffAuthController;
use App\Http\Controllers\Identity\Staff\StaffEnrolController;
use App\Http\Controllers\Identity\TwoFactorChallengeController;
use App\Http\Controllers\Identity\TwoFactorController;
use App\Http\Controllers\Identity\TwoFactorSetupController;
use App\Http\Controllers\Identity\VerificationController;
use Illuminate\Support\Facades\Route;

/*
 * Identity and authentication routes (docs/DASHBOARD_BUILD.md 7.16). Loaded by the
 * web group, so every state-changing route here is CSRF protected.
 */
Route::middleware('guest')->group(function () {
    Route::inertia('/signup', 'Auth/Signup')->name('signup');
    Route::post('/register', [RegisterController::class, 'store'])->name('register');
    Route::inertia('/login', 'Auth/Login')->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');

    // The second step of sign in: reachable only with a pending sign in (a password already accepted).
    Route::get('/login/two-factor', [TwoFactorChallengeController::class, 'show'])->name('login.two-factor');
    Route::post('/login/two-factor', [TwoFactorChallengeController::class, 'store'])->name('login.two-factor.store');
    Route::get('/login/recovery', [TwoFactorChallengeController::class, 'recoveryShow'])->name('login.recovery');
    Route::post('/login/recovery', [TwoFactorChallengeController::class, 'recoveryStore'])->name('login.recovery.store');
});

Route::post('/logout', [LogoutController::class, 'destroy'])->middleware('auth')->name('logout');

Route::get('/verify-email', [VerificationController::class, 'notice'])->name('verification.notice');
Route::post('/verify-email', [VerificationController::class, 'confirm'])->name('verification.confirm');
Route::post('/verify-email/resend', [VerificationController::class, 'resend'])->name('verification.send');

// Password reset (public) ------------------------------------------------------------------------
Route::middleware('guest')->group(function () {
    Route::post('/forgot-password', [PasswordResetController::class, 'request'])->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'store'])->name('password.store');
});

// Re-confirmation and the account's own password (signed in) -----------------------------------------
Route::middleware('auth')->group(function () {
    Route::get('/confirm-password', [ConfirmPasswordController::class, 'show'])->name('password.confirm');
    Route::post('/confirm-password', [ConfirmPasswordController::class, 'store'])->name('password.confirm.store');
    Route::post('/user/password', [PasswordController::class, 'update'])->middleware(['throttle:password-change', 'password.confirm'])->name('user-password.update');

    Route::get('/two-factor/setup', [TwoFactorSetupController::class, 'show'])->name('two-factor.setup');

    // Two-factor management (JSON). There is no GET that returns a secret or a recovery code.
    Route::post('/user/two-factor', [TwoFactorController::class, 'store'])->middleware('password.confirm')->name('two-factor.enable');
    Route::post('/user/two-factor/confirm', [TwoFactorController::class, 'confirm'])->name('two-factor.confirm');
    Route::delete('/user/two-factor', [TwoFactorController::class, 'destroy'])->middleware('password.confirm')->name('two-factor.disable');
    Route::post('/user/two-factor/snooze', [TwoFactorController::class, 'snooze'])->name('two-factor.snooze');
    // Sessions and devices (JSON).
    Route::get('/user/sessions', [SessionController::class, 'index'])->name('sessions.index');
    Route::delete('/user/sessions/{handle}', [SessionController::class, 'destroy'])->middleware('password.confirm')->name('sessions.destroy');
    Route::post('/user/sessions/revoke-others', [SessionController::class, 'revokeOthers'])->middleware('password.confirm')->name('sessions.revoke-others');
    Route::post('/user/recovery-codes', [RecoveryCodeController::class, 'store'])->middleware('password.confirm')->name('recovery-codes.regenerate');
});

// Operations console (staff guard) -----------------------------------------------------------------
// ConfigureStaffSession gives /ops its own cookie, session table and default guard before the
// session starts, so none of this shares a session with the customer routes above.
Route::prefix('ops')->group(function () {
    Route::middleware('guest:staff')->group(function () {
        Route::get('/login', [StaffAuthController::class, 'create'])->name('ops.login');
        Route::post('/login', [StaffAuthController::class, 'store'])->name('ops.login.store');
        Route::get('/login/two-factor', [StaffAuthController::class, 'challengeShow'])->name('ops.login.two-factor');
        Route::post('/login/two-factor', [StaffAuthController::class, 'challenge'])->name('ops.login.two-factor.store');
        Route::get('/login/recovery', [StaffAuthController::class, 'recoveryShow'])->name('ops.login.recovery');
        Route::post('/login/recovery', [StaffAuthController::class, 'recovery'])->name('ops.login.recovery.store');
    });

    // Signed in as staff, two-factor not yet required: only what enrolling needs.
    Route::middleware('auth:staff')->group(function () {
        Route::post('/logout', [StaffAuthController::class, 'destroy'])->name('ops.logout');
        Route::post('/confirm-password', [ConfirmPasswordController::class, 'store'])->name('ops.password.confirm.store');
        Route::get('/security/enrol', [StaffEnrolController::class, 'show'])->name('ops.two-factor.setup');
        Route::post('/security/two-factor', [TwoFactorController::class, 'store'])->middleware('password.confirm')->name('ops.two-factor.enable');
        Route::post('/security/two-factor/confirm', [TwoFactorController::class, 'confirm'])->name('ops.two-factor.confirm');
    });

    // Everything else in the console needs confirmed two-factor.
    Route::middleware(['auth:staff', 'staff.two-factor'])->group(function () {
        Route::get('/security/sessions', [SessionController::class, 'index'])->name('ops.sessions.index');
        Route::delete('/security/sessions/{handle}', [SessionController::class, 'destroy'])->middleware('password.confirm')->name('ops.sessions.destroy');
        Route::post('/security/sessions/revoke-others', [SessionController::class, 'revokeOthers'])->middleware('password.confirm')->name('ops.sessions.revoke-others');
        Route::post('/security/password', [PasswordController::class, 'update'])->middleware(['throttle:password-change', 'password.confirm'])->name('ops.user-password.update');
        Route::post('/security/recovery-codes', [RecoveryCodeController::class, 'store'])->middleware('password.confirm')->name('ops.recovery-codes.regenerate');
    });
});
