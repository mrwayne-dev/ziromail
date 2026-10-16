import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const MAX_VISIBLE = 4;
const LEAVE_MS = 160;

function Toast({ item, onDismiss, onPause, onResume }) {
    const live = item.tone === 'bad' ? 'alert' : 'status';
    return (
        <div
            className={`toast${item.tone ? ` toast-${item.tone}` : ''}${item.leaving ? ' is-leaving' : ''}`}
            role={live}
            onMouseEnter={() => onPause(item.id)}
            onMouseLeave={() => onResume(item.id)}
            onFocus={() => onPause(item.id)}
            onBlur={() => onResume(item.id)}
        >
            <div className="bd">
                {item.title && <b>{item.title}</b>}
                {item.message && <p>{item.message}</p>}
                {item.action && <div className="toast-act">{item.action}</div>}
            </div>
            <button type="button" className="toast-x" aria-label="Dismiss notification" onClick={() => onDismiss(item.id)}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
}

/*
 * Mount once near the root (done in app.jsx). Anything below can call
 * useToast().toast({ title, message, tone, duration, action }).
 *   tone      'ok' | 'warn' | 'bad' | undefined
 *   duration  ms before auto-dismiss; 0 keeps it until dismissed
 * Toasts stack newest-first, at most MAX_VISIBLE at once (the oldest is dropped),
 * pause their timer while hovered or focused, and errors are announced
 * assertively.
 */
export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);
    const timers = useRef(new Map());
    const nextId = useRef(1);

    const clearTimer = (id) => {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
    };

    const dismiss = useCallback((id) => {
        clearTimer(id);
        setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
        setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), LEAVE_MS);
    }, []);

    const arm = useCallback(
        (id, duration) => {
            clearTimer(id);
            if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration));
        },
        [dismiss],
    );

    const toast = useCallback(
        ({ duration = 5000, ...rest }) => {
            const id = nextId.current++;
            setItems((list) => {
                const next = [...list, { id, duration, ...rest }];
                // Over the cap: drop the oldest still-visible toast.
                const visible = next.filter((t) => !t.leaving);
                if (visible.length > MAX_VISIBLE) {
                    const oldest = visible[0].id;
                    clearTimer(oldest);
                    return next.filter((t) => t.id !== oldest);
                }
                return next;
            });
            arm(id, duration);
            return id;
        },
        [arm],
    );

    const pause = useCallback((id) => clearTimer(id), []);
    const resume = useCallback(
        (id) => {
            const item = items.find((t) => t.id === id);
            if (item && !item.leaving) arm(id, item.duration);
        },
        [items, arm],
    );

    useEffect(() => {
        const pending = timers.current;
        return () => pending.forEach((t) => clearTimeout(t));
    }, []);

    const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-region" role="region" aria-label="Notifications">
                {items.map((item) => (
                    <Toast key={item.id} item={item} onDismiss={dismiss} onPause={pause} onResume={resume} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
    return ctx;
}
