import { useLayoutEffect, useState } from 'react';
import useReducedMotion from './useReducedMotion';

/*
 * Reveal-on-scroll, kept progressive: content is visible by default and only
 * hidden once this hook has opted the page in by adding `reveal-on` to <html>.
 * If the observer never fires, the 2.5s timer shows the element anyway.
 */
export default function useReveal(ref) {
    const reduced = useReducedMotion();
    const [shown, setShown] = useState(false);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        if (reduced || !('IntersectionObserver' in window)) {
            setShown(true);
            return undefined;
        }

        document.documentElement.classList.add('reveal-on');

        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setShown(true);
                    io.disconnect();
                }
            },
            { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
        );
        io.observe(el);
        const safety = setTimeout(() => setShown(true), 2500);

        return () => {
            io.disconnect();
            clearTimeout(safety);
        };
    }, [ref, reduced]);

    return shown;
}
