import { useCallback, useState } from 'react';

// Open/close state for modals, menus and the like.
export default function useDisclosure(initial = false) {
    const [isOpen, setIsOpen] = useState(initial);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((v) => !v), []);
    return { isOpen, open, close, toggle };
}
