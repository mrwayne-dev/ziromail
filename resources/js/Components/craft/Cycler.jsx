import { useEffect, useState } from 'react';
import useReducedMotion from '../../Hooks/useReducedMotion';

// Swaps one phrase for the next in place. Reduced motion shows the first phrase
// and never rotates.
export default function Cycler({ items, hold = 2200 }) {
    const reduced = useReducedMotion();
    const [state, setState] = useState({ current: 0, leaving: null });

    useEffect(() => {
        if (reduced || items.length < 2) return undefined;

        let clear;
        const tick = setInterval(() => {
            setState((s) => ({ current: (s.current + 1) % items.length, leaving: s.current }));
            clear = setTimeout(() => setState((s) => ({ ...s, leaving: null })), 460);
        }, hold);

        return () => {
            clearInterval(tick);
            clearTimeout(clear);
        };
    }, [reduced, items.length, hold]);

    return (
        <span className="cycler" aria-live="polite">
            {items.map((text, i) => (
                <span key={text} className={i === state.current ? 'on' : i === state.leaving ? 'out' : undefined}>
                    {text}
                </span>
            ))}
        </span>
    );
}
