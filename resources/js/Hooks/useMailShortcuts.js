import { useEffect } from 'react';

// j / k move through the list, e archives, # deletes, Escape closes the open message.
export default function useMailShortcuts({ next, previous, archive, trash, close }) {
    useEffect(() => {
        function onKey(event) {
            const target = event.target;
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            if (target.closest?.('input, textarea, select, [contenteditable="true"], dialog')) return;
            const actions = { j: next, k: previous, e: archive, '#': trash, Escape: close };
            const action = actions[event.key];
            if (!action) return;
            event.preventDefault();
            action();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [next, previous, archive, trash, close]);
}
