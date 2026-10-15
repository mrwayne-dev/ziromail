import { useId } from 'react';

/*
 * Label + control + hint/error, wired together: the error sets aria-invalid and
 * is referenced through aria-describedby (DESIGN.md §6).
 * `children` is a render function receiving the props the control must spread.
 */
export default function Field({ label, optional = false, hint, error, children }) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const errId = error ? `${id}-err` : undefined;

    const controlProps = {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': [errId, hintId].filter(Boolean).join(' ') || undefined,
    };

    return (
        <div className={`field${error ? ' field-err' : ''}`}>
            <label className="label" htmlFor={id}>
                {label}
                {optional && <span className="opt"> (optional)</span>}
            </label>
            {children(controlProps)}
            {error && (
                <p className="err" id={errId}>
                    {error}
                </p>
            )}
            {hint && (
                <p className="hint" id={hintId}>
                    {hint}
                </p>
            )}
        </div>
    );
}

export function Input(props) {
    return <input className="input" {...props} />;
}

export function Textarea(props) {
    return <textarea className="textarea" {...props} />;
}
