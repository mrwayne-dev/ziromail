import { useEffect, useRef } from 'react';

// Closes a menu on Escape (returning focus to its button) or a click outside `ref`.
export default function useDismissible(isOpen, close) {
    const ref = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onPointer = (event) => {
            if (ref.current && !ref.current.contains(event.target)) close();
        };
        const onKey = (event) => {
            if (event.key !== 'Escape') return;
            close();
            ref.current?.querySelector('button')?.focus();
        };
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen, close]);

    return ref;
}
