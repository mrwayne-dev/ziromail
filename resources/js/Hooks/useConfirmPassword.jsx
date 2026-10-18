import { usePage } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';
import ConfirmPasswordDialog from '../Components/domain/ConfirmPasswordDialog';

/*
 * Runs a sensitive action only after a recent password confirmation. If the
 * server says the confirmation is still fresh the action runs at once; otherwise
 * the dialog opens first. `dialog` must be rendered by the caller. The server
 * enforces the same rule on the route, so skipping this hook gains nothing.
 */
export default function useConfirmPassword(confirmUrl) {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const pending = useRef(null);

    const confirm = useCallback((action) => {
        const until = auth?.confirmedUntil ?? 0;
        if (until > Math.floor(Date.now() / 1000)) {
            action();
            return;
        }
        pending.current = action;
        setOpen(true);
    }, [auth?.confirmedUntil]);

    const dialog = (
        <ConfirmPasswordDialog
            confirmUrl={confirmUrl}
            open={open}
            onClose={() => setOpen(false)}
            onConfirmed={() => {
                setOpen(false);
                const action = pending.current;
                pending.current = null;
                action?.();
            }}
        />
    );

    return { confirm, dialog };
}
