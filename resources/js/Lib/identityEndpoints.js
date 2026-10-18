import { route } from './route';

// URLs the SecurityPanel talks to. The staff console passes its own set (same shapes).
export function webEndpoints() {
    return {
        confirmPassword: route('password.confirm.store'),
        password: route('user-password.update'),
        sessions: route('sessions.index'),
        revokeSession: (handle) => route('sessions.destroy', { handle }),
        revokeOthers: route('sessions.revoke-others'),
        twoFactorStart: route('two-factor.enable', undefined, false),
        twoFactorConfirm: route('two-factor.confirm', undefined, false),
        twoFactorDisable: route('two-factor.disable'),
        recoveryCodes: route('recovery-codes.regenerate'),
    };
}

// The same set for the operations console: its own routes, its own session and password confirmation.
export function staffEndpoints() {
    return {
        confirmPassword: route('ops.password.confirm.store'),
        password: route('ops.user-password.update'),
        sessions: route('ops.sessions.index'),
        revokeSession: (handle) => route('ops.sessions.destroy', { handle }),
        revokeOthers: route('ops.sessions.revoke-others'),
        twoFactorStart: route('ops.two-factor.enable', undefined, false),
        twoFactorConfirm: route('ops.two-factor.confirm', undefined, false),
        twoFactorDisable: null,
        recoveryCodes: route('ops.recovery-codes.regenerate'),
    };
}
