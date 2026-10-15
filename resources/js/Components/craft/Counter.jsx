import { useEffect, useRef, useState } from 'react';
import useReducedMotion from '../../Hooks/useReducedMotion';

// Counts up from zero the first time it is mostly on screen (easeOutCubic).
export default function Counter({ to, suffix = '', duration = 1100 }) {
    const reduced = useReducedMotion();
    const ref = useRef(null);
    const [value, setValue] = useState(reduced ? to : 0);

    useEffect(() => {
        if (reduced || !('IntersectionObserver' in window)) {
            setValue(to);
            return undefined;
        }

        let frame;
        const io = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                io.disconnect();
                const t0 = performance.now();
                const step = (now) => {
                    const p = Math.min(1, (now - t0) / duration);
                    setValue(Math.round(to * (1 - (1 - p) ** 3)));
                    if (p < 1) frame = requestAnimationFrame(step);
                };
                frame = requestAnimationFrame(step);
            },
            { threshold: 0.4 },
        );
        io.observe(ref.current);

        return () => {
            io.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [to, duration, reduced]);

    return (
        <span ref={ref} className="count-up">
            {value.toLocaleString('en-NG')}
            {suffix}
        </span>
    );
}
