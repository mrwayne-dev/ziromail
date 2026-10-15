import { useSyncExternalStore } from 'react';

/*
 * Term and currency are shared by every pricing surface (home page, pricing
 * page), so they live in a module-level store rather than component state:
 * switching to dollars on one page should still hold on the next.
 */
let state = { currency: 'NGN', term: 'annual' };
const listeners = new Set();

function emit() {
    listeners.forEach((listener) => listener());
}

export function setCurrency(currency) {
    if (state.currency === currency) return;
    state = { ...state, currency };
    emit();
}

export function setTerm(term) {
    if (state.term === term) return;
    state = { ...state, term };
    emit();
}

export default function usePricingState() {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        () => state,
        () => state,
    );
}
