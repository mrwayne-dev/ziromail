import { useLayoutEffect } from 'react';
import { usePage } from '@inertiajs/react';

/*
 * Heroes animate on load. ziro.css keys that off `hero-anim` on <html>, which
 * the prototype added in the document head before first paint. In a client-
 * rendered app the equivalent is a layout effect after each navigation, so the
 * class is present only on pages that actually contain a [data-hero].
 */
export default function useHeroAnimation() {
    const { url } = usePage();

    useLayoutEffect(() => {
        const root = document.documentElement;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hasHero = document.querySelector('[data-hero]') !== null;
        root.classList.toggle('hero-anim', hasHero && !reduced);
        return () => root.classList.remove('hero-anim');
    }, [url]);
}
