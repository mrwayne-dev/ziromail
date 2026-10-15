import { useEffect, useRef } from 'react';
import useReducedMotion from '../../Hooks/useReducedMotion';

// A vertical line that fills as its section scrolls past. Fill is written to a
// CSS custom property so React does not re-render on every scroll event.
export default function Rail({ className = '', children, ...rest }) {
    const ref = useRef(null);
    const reduced = useReducedMotion();

    useEffect(() => {
        const el = ref.current;
        if (!el || reduced) return undefined;

        const tick = () => {
            const b = el.getBoundingClientRect();
            const vh = window.innerHeight;
            // 0% when the top reaches 80% of the viewport, 100% when the bottom passes 40%.
            const p = (vh * 0.8 - b.top) / (b.height + vh * 0.4);
            el.style.setProperty('--fill', `${Math.max(0, Math.min(1, p)) * 100}%`);
        };
        window.addEventListener('scroll', tick, { passive: true });
        window.addEventListener('resize', tick);
        tick();

        return () => {
            window.removeEventListener('scroll', tick);
            window.removeEventListener('resize', tick);
        };
    }, [reduced]);

    return (
        <div ref={ref} className={`rail ${className}`.trim()} {...rest}>
            {children}
        </div>
    );
}
