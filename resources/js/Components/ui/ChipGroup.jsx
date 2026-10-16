import { useRef } from 'react';

/*
 * A single-choice set of chips, built as a radio group: one tab stop, arrow keys
 * move and select, Home/End jump to the ends.
 *   options  [{ value, label }]
 *   label    accessible name for the group (not shown)
 */
export default function ChipGroup({ options, value, onChange, label }) {
    const refs = useRef([]);

    function onKeyDown(e, index) {
        const last = options.length - 1;
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index === last ? 0 : index + 1;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index === 0 ? last : index - 1;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = last;
        if (next === null) return;
        e.preventDefault();
        onChange(options[next].value);
        refs.current[next]?.focus();
    }

    return (
        <div className="chips" role="radiogroup" aria-label={label}>
            {options.map((option, i) => {
                const checked = option.value === value;
                return (
                    <button
                        key={option.value}
                        ref={(el) => { refs.current[i] = el; }}
                        type="button"
                        role="radio"
                        className="chip"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
