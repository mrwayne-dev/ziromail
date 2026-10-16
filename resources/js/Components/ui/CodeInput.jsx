import { useRef } from 'react';

/*
 * A row of single-digit boxes. Typing moves forward, Backspace moves back,
 * arrow keys move between boxes, and pasting a whole code fills the row. The
 * value is one string, so the page treats it like any other field.
 */
export default function CodeInput({ value, onChange, digits = 6, invalid = false, describedBy, autoFocus = false }) {
    const refs = useRef([]);
    const chars = Array.from({ length: digits }, (_, i) => value[i] ?? '');

    function focusAt(i) {
        const el = refs.current[Math.max(0, Math.min(digits - 1, i))];
        el?.focus();
        el?.select();
    }

    function setAt(i, char) {
        const next = chars.slice();
        next[i] = char;
        onChange(next.join('').slice(0, digits));
    }

    function onInput(e, i) {
        const typed = e.target.value.replace(/\D/g, '');
        if (!typed) {
            setAt(i, '');
            return;
        }
        if (typed.length > 1) {
            fill(typed, i);
            return;
        }
        setAt(i, typed);
        if (i < digits - 1) focusAt(i + 1);
    }

    function fill(text, from = 0) {
        const pasted = text.replace(/\D/g, '');
        if (!pasted) return;
        const next = chars.slice();
        pasted.split('').forEach((c, k) => {
            if (from + k < digits) next[from + k] = c;
        });
        onChange(next.join(''));
        focusAt(Math.min(from + pasted.length, digits - 1));
    }

    function onKeyDown(e, i) {
        if (e.key === 'Backspace' && !chars[i] && i > 0) {
            e.preventDefault();
            setAt(i - 1, '');
            focusAt(i - 1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            focusAt(i - 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            focusAt(i + 1);
        }
    }

    return (
        <div className="code-row">
            {chars.map((char, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    className="code-box"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={digits}
                    value={char}
                    placeholder=" "
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    autoFocus={autoFocus && i === 0}
                    aria-label={`Digit ${i + 1}`}
                    aria-invalid={invalid ? true : undefined}
                    aria-describedby={describedBy}
                    onChange={(e) => onInput(e, i)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    onPaste={(e) => {
                        e.preventDefault();
                        fill(e.clipboardData.getData('text'), 0);
                    }}
                    onFocus={(e) => e.target.select()}
                />
            ))}
        </div>
    );
}
