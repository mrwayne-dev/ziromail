import { useEffect, useId, useRef } from 'react';

// Counts open modals so the page only unlocks scrolling when the last one closes.
let openCount = 0;
function lockScroll() {
    if (openCount++ === 0) document.body.classList.add('modal-open');
}
function unlockScroll() {
    if (--openCount <= 0) {
        openCount = 0;
        document.body.classList.remove('modal-open');
    }
}

/*
 * A modal built on the native <dialog>. showModal() provides what is hard to get
 * right by hand: the page behind goes inert, focus is trapped inside, Escape
 * closes, and focus returns to whatever opened it. Modals opened from inside
 * another modal stack in the browser's top layer.
 *
 *   open      boolean, controlled by the parent (see useDisclosure)
 *   onClose   called for Escape, the close button and a click on the backdrop
 *   title     required: it names the dialog for assistive tech
 *   footer    node for the action row
 *   dismissOnBackdrop  set false for a modal the user must answer
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md', dismissOnBackdrop = true }) {
    const ref = useRef(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return undefined;

        if (open && !dialog.open) {
            dialog.showModal();
            lockScroll();
        }
        if (!open && dialog.open) {
            dialog.close();
            unlockScroll();
        }

        return () => {
            if (dialog.open) {
                dialog.close();
                unlockScroll();
            }
        };
    }, [open]);

    const cls = ['modal', size === 'sm' && 'modal-sm', size === 'lg' && 'modal-lg'].filter(Boolean).join(' ');

    return (
        <dialog
            ref={ref}
            className={cls}
            aria-labelledby={titleId}
            onCancel={(e) => {
                // Escape: let React state drive the close so the two never disagree.
                e.preventDefault();
                onClose();
            }}
            onClick={(e) => {
                if (dismissOnBackdrop && e.target === ref.current) onClose();
            }}
        >
            <div className="modal-hd">
                <h2 id={titleId}>{title}</h2>
                <button type="button" className="modal-x" aria-label="Close" onClick={onClose}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
            <div className="modal-bd">{children}</div>
            {footer && <div className="modal-ft">{footer}</div>}
        </dialog>
    );
}
