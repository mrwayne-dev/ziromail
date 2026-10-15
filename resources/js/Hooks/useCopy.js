import { useCallback, useEffect, useRef, useState } from 'react';

// Falls back to a hidden textarea where the async clipboard API is unavailable.
export default function useCopy(resetMs = 1400) {
    const [copied, setCopied] = useState(false);
    const timer = useRef(null);

    useEffect(() => () => clearTimeout(timer.current), []);

    const copy = useCallback(
        async (text) => {
            if (!text) return false;
            let ok = false;
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                    ok = true;
                }
            } catch {
                ok = false;
            }
            if (!ok) {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.cssText = 'position:absolute;left:-9999px';
                document.body.appendChild(ta);
                ta.select();
                try {
                    ok = document.execCommand('copy');
                } catch {
                    ok = false;
                }
                document.body.removeChild(ta);
            }
            if (ok) {
                setCopied(true);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setCopied(false), resetMs);
            }
            return ok;
        },
        [resetMs],
    );

    return { copied, copy };
}
